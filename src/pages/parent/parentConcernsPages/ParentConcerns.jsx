import { useAuth } from '../../../hooks/useAuth';
import Sidebar from '../../../components/sidebar/Sidebar';
import { getParentConfig } from '../../../components/sidebar/sidebarConfigs';
import useConcerns from '../../../hooks/useConcerns';
import ConcernsPage from '../../../components/concerns/ConcernsPage';

const ParentSidebarWrapper = () => <Sidebar {...getParentConfig()} />;

const ParentConcerns = () => {
  const { currentUser } = useAuth();

  return (
    <ConcernsPage
      sidebar={ParentSidebarWrapper}
      useConcernsHook={useConcerns}
      currentUser={currentUser}
    />
  );
};

export default ParentConcerns;
