import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import useAdminConcerns from '../../hooks/useAdminConcerns';
import ConcernsPage from '../../components/concerns/ConcernsPage';

const Concerns = () => {
  const { currentUser } = useAuth();

  return (
    <ConcernsPage
      sidebar={AdminSidebar}
      useConcernsHook={useAdminConcerns}
      currentUser={currentUser}
    />
  );
};

export default Concerns;
