import React, { useState } from 'react';
import {
  RaiseConcernModal,
  ConcernsList,
  ConcernDetail,
  BackButton
} from './index';
import Loading from '../common/Loading';
import { useToast } from '../../context/ToastContext';

import './ConcernsPage.css';

const ConcernsPage = ({
  sidebar: Sidebar,
  useConcernsHook,
  currentUser
}) => {
  const toast = useToast();
  const {
    concerns,
    children,
    selectedConcern,
    messages,
    loading,
    sending,
    createConcern,
    sendReply,
    selectConcern,
    clearSelection,
    updateStatus
  } = useConcernsHook(currentUser?.uid);

  const [mobileView, setMobileView] = useState('list');
  const [showNewModal, setShowNewModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parentFilter, setParentFilter] = useState('all');

  // Extract unique parents from concerns for admin filter
  const uniqueParents = React.useMemo(() => {
    const parentMap = new Map();
    concerns.forEach(c => {
      if (c.createdByUserId && c.createdByUserName) {
        if (!parentMap.has(c.createdByUserId)) {
          parentMap.set(c.createdByUserId, {
            id: c.createdByUserId,
            name: c.createdByUserName,
            count: 1
          });
        } else {
          parentMap.get(c.createdByUserId).count++;
        }
      }
    });
    return Array.from(parentMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [concerns]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // Handle concern creation with toast feedback
  const handleCreateConcern = async (data) => {
    try {
      await createConcern(data, currentUser);
      toast.success('Concern submitted successfully!');
      setShowNewModal(false);
    } catch (error) {
      toast.error('Failed to submit concern. Please try again.');
    }
  };

  // Handle status update with toast feedback
  const handleStatusUpdate = async (concernId, newStatus) => {
    try {
      await updateStatus(concernId, newStatus);
      toast.success(`Concern marked as ${newStatus.replace(/_/g, ' ')}`);
    } catch (error) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  const filteredConcerns = React.useMemo(() => {
    let filtered = concerns;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Apply parent filter (admin only)
    if (isAdmin && parentFilter !== 'all') {
      filtered = filtered.filter(c => c.createdByUserId === parentFilter);
    }

    return filtered;
  }, [concerns, statusFilter, parentFilter, isAdmin]);

  const handleSelectConcern = (concern) => {
    selectConcern(concern);
    setMobileView('detail');
  };

  const handleBackToList = () => {
    setMobileView('list');
    clearSelection();
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      await sendReply(
        selectedConcern.id,
        replyText,
        {
          id: currentUser.uid,
          name: `${currentUser.firstName} ${currentUser.lastName}`
        }
      );
      setReplyText('');
      toast.success('Reply sent successfully!');
    } catch (error) {
      toast.error('Failed to send reply. Please try again.');
    }
  };

  if (loading) {
    return <Loading message="Loading concerns" variant="inline" />;
  }

  //for live update of concern detail dropdown status
  const activeConcern = selectedConcern
  ? concerns.find(c => c.id === selectedConcern.id)
  : null;


  return (
    <div className="pc-page-wrapper">
      <Sidebar />

      <main className="pc-content-container">

        <RaiseConcernModal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateConcern}
          children={children}
          isSubmitting={sending}
        />

        <ConcernsList
          concerns={filteredConcerns}
          selectedConcernId={selectedConcern?.id}
          onSelectConcern={handleSelectConcern}
          onNewConcern={() => setShowNewModal(true)}
          isHidden={mobileView === 'detail'}
          userRole={currentUser?.role}
          currentUserId={currentUser?.uid}
          updateStatus={handleStatusUpdate}
          statusFilter={statusFilter}
          onFilterStatusChange={setStatusFilter}
          parentFilter={parentFilter}
          onFilterParentChange={setParentFilter}
          uniqueParents={uniqueParents}
        />

        <section className={`pc-detail-column ${selectedConcern ? 'visible' : ''}`}>
          <BackButton onClick={handleBackToList} />

          <ConcernDetail
            concern={activeConcern}
            messages={messages}
            currentUserId={currentUser?.uid}
            replyText={replyText}
            onReplyChange={setReplyText}
            onSendReply={handleSendReply}
            isSending={sending}
            userRole={currentUser?.role}
            updateStatus={handleStatusUpdate}
            onNewConcern={() => setShowNewModal(true)}
          />
        </section>
      </main>
    </div>
  );
};

export default ConcernsPage;
