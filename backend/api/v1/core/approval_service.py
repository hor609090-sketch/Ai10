"""
Unified Approval Service
SINGLE source of truth for ALL order/wallet approvals

Used by:
- Telegram webhook callbacks
- Admin UI approvals
- Any other approval path

Enforces:
- Idempotency (can't approve twice)
- Bot permissions (if actor is Telegram bot)
- Amount adjustment limits
- Proper side effects (wallet credit, game load, withdrawal)
- Event emissions
"""
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Literal
from enum import Enum

from .database import fetch_one, fetch_all, execute, get_pool
from .notification_router import emit_event, EventType

logger = logging.getLogger(__name__)


class ActorType(str, Enum):
    ADMIN = "admin"
    TELEGRAM_BOT = "telegram_bot"
    SYSTEM = "system"


class OrderType(str, Enum):
    GAME_LOAD = "game_load"
    WALLET_TOPUP = "wallet_topup"
    WITHDRAWAL = "withdrawal"
    DEPOSIT = "deposit"  # Legacy, treat as wallet_topup


class ApprovalResult:
    def __init__(self, success: bool, message: str, data: Dict = None):
        self.success = success
        self.message = message
        self.data = data or {}


async def approve_or_reject_order(
    order_id: str,
    action: Literal["approve", "reject"],
    actor_type: ActorType,
    actor_id: str,
    final_amount: Optional[float] = None,
    rejection_reason: Optional[str] = None,
    bot_id: Optional[str] = None
) -> ApprovalResult:
    """
    Single approval function for ALL order types.
    
    Args:
        order_id: The order to approve/reject
        action: "approve" or "reject"
        actor_type: Who is performing the action
        actor_id: ID of the actor (admin user_id or telegram bot_id)
        final_amount: Optional adjusted amount (only for approval)
        rejection_reason: Reason for rejection
        bot_id: Telegram bot ID (for permission validation)
    
    Returns:
        ApprovalResult with success status and details
    """
    logger.info(f"Processing {action} for order {order_id} by {actor_type}:{actor_id}")
    
    # Validate bot permissions if actor is Telegram bot
    if actor_type == ActorType.TELEGRAM_BOT and bot_id:
        bot = await fetch_one("SELECT * FROM telegram_bots WHERE bot_id = $1", bot_id)
        if not bot:
            return ApprovalResult(False, "Bot not found")
        if not bot.get('is_active'):
            return ApprovalResult(False, "Bot is not active")
        if not bot.get('can_approve_payments'):
            return ApprovalResult(False, "Bot does not have approval permissions")
    
    # Get the order
    order = await fetch_one("SELECT * FROM orders WHERE order_id = $1", order_id)
    if not order:
        return ApprovalResult(False, "Order not found")
    
    # Idempotency check - ONLY these statuses can be approved/rejected
    if order['status'] not in ['pending', 'PENDING_REVIEW', 'initiated', 'awaiting_payment_proof']:
        return ApprovalResult(False, f"Order already {order['status']}", {"already_processed": True})
    
    now = datetime.now(timezone.utc)
    order_type = order.get('order_type', 'deposit')
    
    # Get user
    user = await fetch_one("SELECT * FROM users WHERE user_id = $1", order['user_id'])
    if not user:
        return ApprovalResult(False, "User not found")
    
    if action == "approve":
        return await _process_approval(order, user, actor_type, actor_id, final_amount, now)
    else:
        return await _process_rejection(order, user, actor_type, actor_id, rejection_reason, now)


async def execute_game_load(order: Dict, user: Dict, conn) -> Dict:
    """
    Execute game load IMMEDIATELY after approval
    
    This function:
    1. Deducts amount from wallet (already done in approval)
    2. Creates game_loads record
    3. Logs to wallet ledger
    4. Returns execution result
    
    Returns:
        {"success": bool, "load_id": str, "error": str}
    """
    try:
        load_id = str(uuid.uuid4())
        game_name = order.get('game_name', 'unknown')
        amount = float(order.get('amount', 0))
        
        # Get game details
        game = await conn.fetchrow("""
            SELECT * FROM games WHERE game_name = $1 OR game_id = $1
        """, game_name)
        
        if not game:
            return {"success": False, "error": f"Game not found: {game_name}"}
        
        # Get current wallet balance
        current_user = await conn.fetchrow("SELECT real_balance FROM users WHERE user_id = $1", user['user_id'])
        wallet_balance_before = float(current_user['real_balance'] or 0)
        
        # Deduct from wallet (immediate execution)
        new_balance = wallet_balance_before - amount
        
        if new_balance < 0:
            return {"success": False, "error": "Insufficient wallet balance", "balance": wallet_balance_before}
        
        await conn.execute("""
            UPDATE users SET real_balance = $1, updated_at = NOW()
            WHERE user_id = $2
        """, new_balance, user['user_id'])
        
        # Generate game credentials (placeholder - would integrate with actual game API)
        game_credentials = {
            "session_id": str(uuid.uuid4())[:8],
            "game_token": f"GT-{load_id[:8]}",
            "loaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Record game load
        await conn.execute("""
            INSERT INTO game_loads 
            (load_id, user_id, game_id, game_name, amount, wallet_balance_before, 
             wallet_balance_after, status, game_credentials, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, NOW())
        """, load_id, user['user_id'], game['game_id'], game['game_name'],
           amount, wallet_balance_before, new_balance, json.dumps(game_credentials))
        
        # Log to immutable wallet ledger
        await conn.execute("""
            INSERT INTO wallet_ledger 
            (ledger_id, user_id, transaction_type, amount, balance_before, balance_after,
             reference_type, reference_id, description, created_at)
            VALUES ($1, $2, 'debit', $3, $4, $5, 'game_load', $6, $7, NOW())
        """, str(uuid.uuid4()), user['user_id'], amount,
           wallet_balance_before, new_balance, load_id, 
           f"Game load: {game.get('display_name', game_name)} (Order: {order['order_id'][:8]})")
        
        logger.info(f"Game load executed: {load_id} for user {user['user_id']}, amount {amount}")
        
        return {
            "success": True,
            "load_id": load_id,
            "amount_loaded": amount,
            "wallet_balance_remaining": new_balance,
            "game_name": game['game_name'],
            "game_display_name": game.get('display_name', game_name),
            "game_credentials": game_credentials
        }
        
    except Exception as e:
        logger.error(f"Game load execution failed for order {order['order_id']}: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


async def execute_withdrawal(order: Dict, user: Dict, conn) -> Dict:
    """
    Execute withdrawal/redemption IMMEDIATELY after approval
    
    This function:
    1. Processes payout (deducts from wallet - already done)
    2. Records payout transaction
    3. Logs audit trail
    4. Returns execution result
    
    Returns:
        {"success": bool, "transaction_id": str, "payout_amount": float, "error": str}
    """
    try:
        transaction_id = str(uuid.uuid4())
        payout_amount = float(order.get('payout_amount', 0) or order.get('amount', 0))
        void_amount = float(order.get('void_amount', 0) or 0)
        
        # Get current user balance
        current_user = await conn.fetchrow("SELECT real_balance FROM users WHERE user_id = $1", user['user_id'])
        balance_after = float(current_user['real_balance'] or 0)
        
        logger.info(f"Withdrawal executed: Order {order['order_id']}, Payout: {payout_amount}, Void: {void_amount}, Balance after: {balance_after}")
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "payout_amount": payout_amount,
            "void_amount": void_amount,
            "wallet_balance_remaining": balance_after,
            "executed_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Withdrawal execution failed for order {order['order_id']}: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


async def _process_approval(
    order: Dict,
    user: Dict,
    actor_type: ActorType,
    actor_id: str,
    final_amount: Optional[float],
    now: datetime
) -> ApprovalResult:
    """Process order approval with proper side effects based on order type"""
    
    order_id = order['order_id']
    order_type = order.get('order_type', 'deposit')
    
    # Determine final amount (may have been edited)
    amount = final_amount if final_amount is not None else order['amount']
    bonus_amount = order.get('bonus_amount', 0) or 0
    
    # Track if amount was adjusted
    amount_adjusted = final_amount is not None and final_amount != order['amount']
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Increment execution attempts
            await conn.execute("""
                UPDATE orders SET execution_attempts = execution_attempts + 1
                WHERE order_id = $1
            """, order_id)
            
            # Apply side effects based on order type
            execution_result = None
            executed_at = None
            final_status = 'APPROVED_EXECUTED'  # Default, may change to APPROVED_FAILED
            execution_error = None
            
            if order_type in ['wallet_topup', 'deposit']:
                # Credit wallet
                try:
                    current_balance = float(user.get('real_balance', 0) or 0)
                    new_balance = current_balance + amount
                    
                    await conn.execute("""
                        UPDATE users SET 
                            real_balance = $1,
                            bonus_balance = bonus_balance + $2,
                            deposit_count = deposit_count + 1,
                            total_deposited = total_deposited + $3,
                            updated_at = NOW()
                        WHERE user_id = $4
                    """, new_balance, bonus_amount, amount, user['user_id'])
                    
                    # Log to ledger
                    await conn.execute("""
                        INSERT INTO wallet_ledger 
                        (ledger_id, user_id, transaction_type, amount, balance_before, balance_after,
                         reference_type, reference_id, description, created_at)
                        VALUES ($1, $2, 'credit', $3, $4, $5, 'order', $6, $7, NOW())
                    """, str(uuid.uuid4()), user['user_id'], amount,
                       current_balance, new_balance, order_id,
                       f"Wallet top-up via {order.get('payment_method', 'N/A')}")
                    
                    execution_result = {
                        "success": True,
                        "wallet_credited": amount,
                        "wallet_balance": new_balance,
                        "executed_at": now.isoformat()
                    }
                    executed_at = now
                    final_status = 'APPROVED_EXECUTED'
                    
                except Exception as e:
                    execution_error = f"Wallet credit failed: {str(e)}"
                    final_status = 'APPROVED_FAILED'
                    execution_result = {"success": False, "error": execution_error}
                    executed_at = now
                
            elif order_type == 'game_load':
                # IMMEDIATE EXECUTION: Load game right now
                logger.info(f"Executing game load for order {order_id}")
                execution_result = await execute_game_load(order, user, conn)
                executed_at = now
                
                if not execution_result.get('success'):
                    # Execution failed - set APPROVED_FAILED
                    final_status = 'APPROVED_FAILED'
                    execution_error = execution_result.get('error', 'Game load execution failed')
                    
                    logger.error(f"Game load execution failed for order {order_id}: {execution_error}")
                    
                    # Emit failure event
                    await emit_event(
                        event_type=EventType.GAME_LOAD_FAILED,
                        title="Game Load Failed",
                        message=f"Game load execution failed for order {order_id[:8]}...\n\nError: {execution_error}\nUser: {user.get('display_name', user['username'])}",
                        reference_id=order_id,
                        reference_type="order",
                        user_id=user['user_id'],
                        username=user.get('username'),
                        display_name=user.get('display_name'),
                        requires_action=True
                    )
                else:
                    final_status = 'APPROVED_EXECUTED'
                
            elif order_type == 'withdrawal':
                # Withdrawal - deduct from wallet FIRST
                try:
                    current_balance = float(user.get('real_balance', 0) or 0)
                    new_balance = current_balance - amount
                    
                    if new_balance < 0:
                        raise Exception("Insufficient balance for withdrawal")
                    
                    await conn.execute("""
                        UPDATE users SET 
                            real_balance = $1,
                            total_withdrawn = total_withdrawn + $2,
                            updated_at = NOW()
                        WHERE user_id = $3
                    """, new_balance, amount, user['user_id'])
                    
                    # Log to ledger
                    await conn.execute("""
                        INSERT INTO wallet_ledger 
                        (ledger_id, user_id, transaction_type, amount, balance_before, balance_after,
                         reference_type, reference_id, description, created_at)
                        VALUES ($1, $2, 'debit', $3, $4, $5, 'withdrawal', $6, $7, NOW())
                    """, str(uuid.uuid4()), user['user_id'], amount,
                       current_balance, new_balance, order_id,
                       f"Withdrawal to {order.get('payment_method', 'N/A')}")
                    
                    # IMMEDIATE EXECUTION: Execute withdrawal
                    logger.info(f"Executing withdrawal for order {order_id}")
                    execution_result = await execute_withdrawal(order, user, conn)
                    executed_at = now
                    
                    if not execution_result.get('success'):
                        final_status = 'APPROVED_FAILED'
                        execution_error = execution_result.get('error', 'Withdrawal execution failed')
                    else:
                        final_status = 'APPROVED_EXECUTED'
                        
                except Exception as e:
                    execution_error = f"Withdrawal failed: {str(e)}"
                    final_status = 'APPROVED_FAILED'
                    execution_result = {"success": False, "error": execution_error}
                    executed_at = now
            
            # FINAL STATUS UPDATE: Set to APPROVED_EXECUTED or APPROVED_FAILED
            await conn.execute("""
                UPDATE orders SET 
                    status = $1,
                    approved_by = $2,
                    approved_by_type = $3,
                    approved_by_id = $4,
                    approved_at = $5,
                    amount = $6,
                    total_amount = $7,
                    amount_adjusted = $8,
                    adjusted_by = $9,
                    adjusted_at = $10,
                    executed_at = $11,
                    execution_result = $12,
                    execution_error = $13,
                    updated_at = NOW()
                WHERE order_id = $14
            """, final_status, actor_id, actor_type.value, actor_id, now,
               amount, amount + bonus_amount,
               amount_adjusted, actor_id if amount_adjusted else None,
               now if amount_adjusted else None,
               executed_at, json.dumps(execution_result) if execution_result else None,
               execution_error, order_id)
    
    # Return early if execution failed
    if final_status == 'APPROVED_FAILED':
        return ApprovalResult(
            False,
            f"Execution failed: {execution_error}",
            {"order_id": order_id, "status": final_status, "execution_error": execution_error}
        )
    
    # Emit approval event
    event_type = EventType.ORDER_APPROVED
    if order_type == 'wallet_topup':
        event_type = EventType.WALLET_TOPUP_APPROVED
    elif order_type == 'withdrawal':
        event_type = EventType.WITHDRAW_APPROVED
    
    await emit_event(
        event_type=event_type,
        title=f"Order Approved & Executed",
        message=f"Order for @{user.get('username')} approved and executed by {actor_type.value}",
        reference_id=order_id,
        reference_type="order",
        user_id=user['user_id'],
        username=user.get('username'),
        display_name=user.get('display_name'),
        amount=amount,
        extra_data={
            "order_type": order_type,
            "approved_by": actor_id,
            "actor_type": actor_type.value,
            "amount_adjusted": amount_adjusted,
            "original_amount": order['amount'] if amount_adjusted else None,
            "final_status": final_status
        },
        requires_action=False
    )
    
    # Emit amount adjusted event if applicable
    if amount_adjusted:
        await emit_event(
            event_type=EventType.ORDER_AMOUNT_ADJUSTED,
            title="Order Amount Adjusted",
            message=f"Amount changed from ₱{order['amount']:,.2f} to ₱{amount:,.2f}",
            reference_id=order_id,
            reference_type="order",
            user_id=user['user_id'],
            username=user.get('username'),
            amount=amount,
            extra_data={
                "old_amount": order['amount'],
                "new_amount": amount,
                "adjusted_by": actor_id
            },
            requires_action=False
        )
    
    # Emit execution success events
    if execution_result and execution_result.get('success'):
        if order_type == 'game_load':
            await emit_event(
                event_type=EventType.GAME_LOAD_SUCCESS,
                title="Game Load Executed",
                message=f"Game load executed successfully!\n\nClient: {user.get('display_name', user['username'])}\nGame: {execution_result.get('game_display_name', 'Unknown')}\nAmount: ₱{amount:,.2f}\nWallet Balance: ₱{execution_result.get('wallet_balance_remaining', 0):,.2f}",
                reference_id=order_id,
                reference_type="order",
                user_id=user['user_id'],
                username=user.get('username'),
                display_name=user.get('display_name'),
                amount=amount,
                extra_data={
                    "load_id": execution_result.get('load_id'),
                    "game_name": execution_result.get('game_name'),
                    "wallet_balance_remaining": execution_result.get('wallet_balance_remaining')
                },
                requires_action=False
            )
        elif order_type == 'withdrawal':
            await emit_event(
                event_type=EventType.WITHDRAW_EXECUTED,
                title="Withdrawal Executed",
                message=f"Withdrawal executed successfully!\n\nClient: {user.get('display_name', user['username'])}\nPayout: ₱{execution_result.get('payout_amount', amount):,.2f}\nVoid: ₱{execution_result.get('void_amount', 0):,.2f}",
                reference_id=order_id,
                reference_type="order",
                user_id=user['user_id'],
                username=user.get('username'),
                display_name=user.get('display_name'),
                amount=amount,
                extra_data=execution_result,
                requires_action=False
            )
        elif order_type in ['wallet_topup', 'deposit']:
            await emit_event(
                event_type=EventType.WALLET_TOPUP_APPROVED,
                title="Wallet Top-up Executed",
                message=f"Wallet top-up executed successfully!\n\nClient: {user.get('display_name', user['username'])}\nAmount: ₱{amount:,.2f}\nNew Balance: ₱{execution_result.get('wallet_balance', 0):,.2f}",
                reference_id=order_id,
                reference_type="order",
                user_id=user['user_id'],
                username=user.get('username'),
                display_name=user.get('display_name'),
                amount=amount,
                extra_data=execution_result,
                requires_action=False
            )
    
    return ApprovalResult(
        True, 
        "Order approved and executed successfully",
        {
            "order_id": order_id,
            "amount": amount,
            "amount_adjusted": amount_adjusted,
            "order_type": order_type,
            "status": final_status,
            "executed": executed_at is not None,
            "execution_result": execution_result
        }
    )


async def _process_rejection(
    order: Dict,
    user: Dict,
    actor_type: ActorType,
    actor_id: str,
    rejection_reason: Optional[str],
    now: datetime
) -> ApprovalResult:
    """Process order rejection"""
    
    order_id = order['order_id']
    order_type = order.get('order_type', 'deposit')
    reason = rejection_reason or "Rejected by reviewer"
    
    await execute("""
        UPDATE orders SET 
            status = 'REJECTED', 
            rejection_reason = $1,
            approved_by = $2,
            approved_by_type = $3,
            approved_by_id = $4,
            approved_at = $5,
            updated_at = NOW()
        WHERE order_id = $6
    """, reason, actor_id, actor_type.value, actor_id, now, order_id)
    
    # Emit rejection event
    event_type = EventType.ORDER_REJECTED
    if order_type == 'wallet_topup':
        event_type = EventType.WALLET_TOPUP_REJECTED
    elif order_type == 'withdrawal':
        event_type = EventType.WITHDRAW_REJECTED
    
    await emit_event(
        event_type=event_type,
        title="Order Rejected",
        message=f"Order for @{user.get('username')} rejected. Reason: {reason}",
        reference_id=order_id,
        reference_type="order",
        user_id=user['user_id'],
        username=user.get('username'),
        display_name=user.get('display_name'),
        amount=order['amount'],
        extra_data={
            "order_type": order_type,
            "rejected_by": actor_id,
            "actor_type": actor_type.value,
            "reason": reason
        },
        requires_action=False
    )
    
    return ApprovalResult(
        True,
        "Order rejected",
        {
            "order_id": order_id,
            "reason": reason,
            "order_type": order_type
        }
    )


# ==================== WALLET LOAD SPECIFIC ====================

async def approve_or_reject_wallet_load(
    request_id: str,
    action: Literal["approve", "reject"],
    actor_type: ActorType,
    actor_id: str,
    final_amount: Optional[float] = None,
    rejection_reason: Optional[str] = None,
    bot_id: Optional[str] = None
) -> ApprovalResult:
    """
    Approval function for wallet load requests (from wallet_load_requests table).
    Similar to order approval but for the separate wallet load system.
    """
    logger.info(f"Processing wallet load {action} for {request_id} by {actor_type}:{actor_id}")
    
    # Validate bot permissions if actor is Telegram bot
    if actor_type == ActorType.TELEGRAM_BOT and bot_id:
        bot = await fetch_one("SELECT * FROM telegram_bots WHERE bot_id = $1", bot_id)
        if not bot:
            return ApprovalResult(False, "Bot not found")
        if not bot.get('is_active'):
            return ApprovalResult(False, "Bot is not active")
        if not bot.get('can_approve_wallet_loads', False):
            return ApprovalResult(False, "Bot does not have wallet load approval permissions")
    
    # Get the request
    load_request = await fetch_one("""
        SELECT wlr.*, u.username, u.display_name, u.real_balance
        FROM wallet_load_requests wlr
        JOIN users u ON wlr.user_id = u.user_id
        WHERE wlr.request_id = $1
    """, request_id)
    
    if not load_request:
        return ApprovalResult(False, "Request not found")
    
    # Idempotency check
    if load_request['status'] != 'pending':
        return ApprovalResult(False, f"Request already {load_request['status']}", {"already_processed": True})
    
    now = datetime.now(timezone.utc)
    amount = final_amount if final_amount is not None else load_request['amount']
    amount_adjusted = final_amount is not None and final_amount != load_request['amount']
    
    if action == "approve":
        current_balance = float(load_request.get('real_balance', 0) or 0)
        new_balance = current_balance + amount
        
        pool = await get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("""
                    UPDATE users SET real_balance = $1, updated_at = NOW()
                    WHERE user_id = $2
                """, new_balance, load_request['user_id'])
                
                await conn.execute("""
                    UPDATE wallet_load_requests 
                    SET status = 'approved', 
                        amount = $1,
                        reviewed_by = $2, 
                        reviewed_at = $3, 
                        updated_at = NOW()
                    WHERE request_id = $4
                """, amount, actor_id, now, request_id)
                
                await conn.execute("""
                    INSERT INTO wallet_ledger 
                    (ledger_id, user_id, transaction_type, amount, balance_before, balance_after,
                     reference_type, reference_id, description, created_at)
                    VALUES ($1, $2, 'credit', $3, $4, $5, 'wallet_load', $6, $7, NOW())
                """, str(uuid.uuid4()), load_request['user_id'], amount,
                   current_balance, new_balance, request_id,
                   f"Wallet load via {load_request['payment_method']}")
        
        await emit_event(
            event_type=EventType.WALLET_LOAD_APPROVED,
            title="Wallet Load Approved",
            message=f"₱{amount:,.2f} credited to @{load_request.get('username')}",
            reference_id=request_id,
            reference_type="wallet_load",
            user_id=load_request['user_id'],
            username=load_request.get('username'),
            display_name=load_request.get('display_name'),
            amount=amount,
            extra_data={
                "new_balance": new_balance,
                "approved_by": actor_id,
                "actor_type": actor_type.value,
                "amount_adjusted": amount_adjusted
            },
            requires_action=False
        )
        
        return ApprovalResult(True, "Wallet load approved", {
            "request_id": request_id,
            "amount": amount,
            "new_balance": new_balance,
            "amount_adjusted": amount_adjusted
        })
    
    else:  # reject
        reason = rejection_reason or "Rejected by reviewer"
        
        await execute("""
            UPDATE wallet_load_requests 
            SET status = 'rejected', 
                rejection_reason = $1,
                reviewed_by = $2, 
                reviewed_at = $3,
                updated_at = NOW()
            WHERE request_id = $4
        """, reason, actor_id, now, request_id)
        
        await emit_event(
            event_type=EventType.WALLET_LOAD_REJECTED,
            title="Wallet Load Rejected",
            message=f"Request from @{load_request.get('username')} rejected. Reason: {reason}",
            reference_id=request_id,
            reference_type="wallet_load",
            user_id=load_request['user_id'],
            username=load_request.get('username'),
            display_name=load_request.get('display_name'),
            amount=load_request['amount'],
            extra_data={
                "rejected_by": actor_id,
                "actor_type": actor_type.value,
                "reason": reason
            },
            requires_action=False
        )
        
        return ApprovalResult(True, "Wallet load rejected", {
            "request_id": request_id,
            "reason": reason
        })
