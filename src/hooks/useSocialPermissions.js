import useStore from '../store/useStore';

export const useSocialPermissions = () => {
  const { activeMember, squad } = useStore();
  
  const myUid = activeMember?.uid || '';
  const isOwner = myUid === (squad?.ownerUid || '');
  const memberFunctions = Array.isArray(activeMember?.function) 
    ? activeMember.function 
    : (activeMember?.function ? [activeMember.function] : []);
    
  const isPressewart = memberFunctions.includes('pressewart');
  const canManageSocial = isOwner || isPressewart;

  return { canManageSocial, isPressewart, isOwner };
};
