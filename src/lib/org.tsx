import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Organization, Membership, OrgRole } from './database.types';

interface OrgContextValue {
  org: Organization | null;
  membership: Membership | null;
  role: OrgRole | null;
  members: Membership[];
  loading: boolean;
  isOwner: boolean;
  isHeadBeekeeper: boolean;
  isStaff: boolean;
  canManage: boolean;
  refetch: () => void;
}

const OrgContext = createContext<OrgContextValue>({
  org: null, membership: null, role: null, members: [], loading: true,
  isOwner: false, isHeadBeekeeper: false, isStaff: false, canManage: false,
  refetch: () => {},
});

export function OrgProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    setLoading(true);

    const { data: memberships } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    const myMembership = memberships?.[0] ?? null;
    setMembership(myMembership);

    if (myMembership) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', myMembership.org_id)
        .single();
      setOrg(orgData ?? null);

      const { data: allMembers } = await supabase
        .from('memberships')
        .select('*')
        .eq('org_id', myMembership.org_id)
        .order('role');
      setMembers(allMembers ?? []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  const role = membership?.role ?? null;

  const value: OrgContextValue = {
    org,
    membership,
    role,
    members,
    loading,
    isOwner: role === 'owner',
    isHeadBeekeeper: role === 'head_beekeeper',
    isStaff: role === 'staff',
    canManage: role === 'owner' || role === 'head_beekeeper',
    refetch: fetchOrg,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  return useContext(OrgContext);
}
