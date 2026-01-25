import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import useAdminConcerns from '../../hooks/useAdminConcerns';
import ConcernsPage from '../../components/concerns/ConcernsPage';
import SeedButton from '../../components/SeedButton';

const Concerns = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const AdminSidebarWrapper = () => <Sidebar {...getAdminConfig(isSuperAdmin)} />;
  
  return (
    <>
      <SeedButton />
      <ConcernsPage
        sidebar={AdminSidebarWrapper}
        useConcernsHook={useAdminConcerns}
        currentUser={currentUser}
      />
    </>
  );
};

export default Concerns;