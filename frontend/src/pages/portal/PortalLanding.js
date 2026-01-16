import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PortalLanding = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { validatePortalToken } = useAuth();
  const [status, setStatus] = useState('validating');
  const [error, setError] = useState('');

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setStatus('error');
        setError('No token provided');
        return;
      }

      const isValid = await validatePortalToken(token);
      
      if (isValid) {
        setStatus('success');
        setTimeout(() => {
          navigate('/portal');
        }, 1500);
      } else {
        setStatus('error');
        setError('This link is invalid or has expired. Please request a new link.');
      }
    };

    validate();
  }, [token, validatePortalToken, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'validating' && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Validating Your Link</h1>
            <p className="text-gray-400">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Welcome!</h1>
            <p className="text-gray-400">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Link Invalid</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              Message us on Messenger to get a new portal link.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PortalLanding;
