import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function SpoofBanner() {
  const { isSpoofing, spoofAdminEmail, user, exitSpoof } = useAuth();
  const navigate = useNavigate();

  if (!isSpoofing) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-3">
      <span className="inline-flex items-center gap-2 font-medium">
        <Eye className="w-4 h-4" />
        Viewing as {user?.email || 'user'} (admin: {spoofAdminEmail})
      </span>
      <button
        type="button"
        onClick={async () => {
          await exitSpoof();
          navigate('/admin');
        }}
        className="px-3 py-1 rounded-md bg-amber-950 text-amber-50 hover:bg-black"
      >
        Exit impersonation
      </button>
    </div>
  );
}
