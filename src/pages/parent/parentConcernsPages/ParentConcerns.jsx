import { useAuth } from '../../../hooks/useAuth';
import ParentSidebar from '../../../components/sidebar/ParentSidebar';
import useConcerns from '../../../hooks/useConcerns';
import ConcernsPage from '../../../components/concerns/ConcernsPage';

const ParentConcerns = () => {
  const { currentUser } = useAuth();

  return (
    <ConcernsPage
      sidebar={ParentSidebar}
      useConcernsHook={useConcerns}
      currentUser={currentUser}
    />
  );
};

export default ParentConcerns;
