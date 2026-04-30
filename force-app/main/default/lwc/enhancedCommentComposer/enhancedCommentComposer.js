import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EnhancedCommentComposer extends LightningElement {
  @api recordId;
  @track bodyHtml = '';
  uploadedContentDocumentIds = [];

  get charCount() {
    return this.bodyHtml ? this.bodyHtml.length : 0;
  }

  get isPublishDisabled() {
    return !this.bodyHtml || this.charCount < 2;
  }

  handleRteChange(event) {
    this.bodyHtml = event.target.value;
  }

  handleUploadFinished(event) {
    const uploadedFiles = event.detail.files || [];
    uploadedFiles.forEach(f => {
      if (f.documentId) this.uploadedContentDocumentIds.push(f.documentId);
    });

    this.dispatchEvent(new ShowToastEvent({ title: 'Upload complete', message: `${uploadedFiles.length} file(s) uploaded`, variant: 'success' }));
  }

  handleSaveDraft() {
    this.saveComment(true);
    this.dispatchEvent(new ShowToastEvent({ title: 'Saved draft', message: 'Draft was queued', variant: 'info' }));
  }

  handlePublish() {
    this.saveComment(false);
  }

  saveComment(isDraft) {
    const detail = {
      recordId: this.recordId,
      bodyHtml: this.bodyHtml,
      isDraft,
      uploadedContentDocumentIds: this.uploadedContentDocumentIds
    };
    this.dispatchEvent(new CustomEvent('savecomment', { detail, bubbles: true }));

    if (!isDraft) {
      // clear composer optimistically
      this.bodyHtml = '';
      this.uploadedContentDocumentIds = [];
      this.dispatchEvent(new ShowToastEvent({ title: 'Published', message: 'Comment published (pending server)', variant: 'success' }));
    }
  }
}
