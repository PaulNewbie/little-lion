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
    clearSelection
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
        />

        <section className={`pc-detail-column ${selectedConcern ? 'visible' : ''}`}>
          <BackButton onClick={handleBackToList} />

          <ConcernDetail
            concern={selectedConcern}
            messages={messages}
            currentUserId={currentUser?.uid}
            replyText={replyText}
            onReplyChange={setReplyText}
            onSendReply={handleSendReply}
            isSending={sending}
          />
        </section>
      </main>
    </div>
  );
};

export default ConcernsPage;
