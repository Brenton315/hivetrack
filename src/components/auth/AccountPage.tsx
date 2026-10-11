import { useAuth } from '../../lib/hooks';

export default function AccountPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
            🐝
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.email}</p>
            <p className="text-sm text-gray-500">Beekeeper</p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-base transition-colors"
        >
          Sign out
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        HiveTrack — Trial hive management for NZ beekeepers
      </p>
    </div>
  );
}
