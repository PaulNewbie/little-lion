import { useAuth } from '../../../hooks/useAuth';
import Sidebar from '../../../components/sidebar/Sidebar';
import { getParentConfig } from '../../../components/sidebar/sidebarConfigs';
import ParentProfileUploader from '../components/ParentProfileUploader';
import useConcerns from '../../../hooks/useParentConcerns';
import ConcernsPage from '../../../components/concerns/ConcernsPage';

const ParentSidebarWrapper = () => <Sidebar {...getParentConfig()} renderExtraProfile={() => <ParentProfileUploader />} />;

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
