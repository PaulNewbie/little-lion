import React, { useState } from 'react';
import {
  RaiseConcernModal,
  ConcernsList,
  ConcernDetail,
  BackButton
} from './index';
import Loading from '../common/Loading';

import './ConcernsPage.css';

const ConcernsPage = ({
  sidebar: Sidebar,
  useConcernsHook,
  currentUser
}) => {
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

    await sendReply(
      selectedConcern.id,
      replyText,
      {
        id: currentUser.uid,
        name: `${currentUser.firstName} ${currentUser.lastName}`
      }
    );

    setReplyText('');
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
          onSubmit={(data) => createConcern(data, currentUser)}
          children={children}
          isSubmitting={sending}
        />

        <ConcernsList
          concerns={concerns}
          selectedConcernId={selectedConcern?.id}
          onSelectConcern={handleSelectConcern}
          onNewConcern={() => setShowNewModal(true)}
          isHidden={mobileView === 'detail'}
          userRole={currentUser?.role}
          updateStatus={updateStatus}
        />

        <section className={`pc-detail-column ${selectedConcern ? 'visible' : ''}`}>
          <BackButton onClick={handleBackToList} />

          <ConcernDetail
            // concern={selectedConcern}
            concern={activeConcern}
            messages={messages}
            currentUserId={currentUser?.uid}
            replyText={replyText}
            onReplyChange={setReplyText}
            onSendReply={handleSendReply}
            isSending={sending}
            userRole={currentUser?.role} 
            updateStatus={updateStatus}
          />
        </section>
      </main>
    </div>
  );
};

export default ConcernsPage;
