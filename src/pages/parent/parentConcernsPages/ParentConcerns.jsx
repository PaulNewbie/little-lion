import { useAuth } from '../../../hooks/useAuth';
import ParentSidebar from '../../../components/sidebar/ParentSidebar';
import useParentConcerns from '../../../hooks/useParentConcerns';
import ConcernsPage from '../../../components/concerns/ConcernsPage';

const ParentConcerns = () => {
  const { currentUser } = useAuth();

  return (
    <ConcernsPage
      sidebar={ParentSidebar}
      useConcernsHook={useParentConcerns}
      currentUser={currentUser}
    />
  );
};

export default ParentConcerns;
