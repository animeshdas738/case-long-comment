import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EnhancedCommentComposer extends LightningElement {
  @api recordId;
  @track bodyHtml = '';
  uploadedContentDocumentIds = [];

  handleRteChange(event) {
    this.bodyHtml = event.target.value;
  }

  handleUploadFinished(event) {
    // lightning-file-upload returns files with documentId
    const uploadedFiles = event.detail.files || [];
    uploadedFiles.forEach(f => {
      if (f.documentId) this.uploadedContentDocumentIds.push(f.documentId);
    });

    this.dispatchEvent(new ShowToastEvent({ title: 'Upload complete', message: `${uploadedFiles.length} file(s) uploaded`, variant: 'success' }));
  }

  handleSaveDraft() {
    this.saveComment(true);
  }

  handlePublish() {
    this.saveComment(false);
  }

  saveComment(isDraft) {
    // Dispatch a custom event so the parent `enhancedCommentApp` or timeline can call Apex
    const detail = {
      recordId: this.recordId,
      bodyHtml: this.bodyHtml,
      isDraft,
      uploadedContentDocumentIds: this.uploadedContentDocumentIds
    };
    this.dispatchEvent(new CustomEvent('savecomment', { detail }));
    // optimistic UI: clear composer on publish
    if (!isDraft) {
      this.bodyHtml = '';
      this.uploadedContentDocumentIds = [];
    }
  }
}
