import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import listComments from '@salesforce/apex/EnhancedCommentController.listComments';

export default class EnhancedCommentTimeline extends LightningElement {
  @api recordId;
  @track comments = [];
  @track pageSize = 10;
  pageNumber = 1;
  searchText = '';
  totalCount = 0;

  pageSizeOptions = [
    { label: '5', value: '5' },
    { label: '10', value: '10' },
    { label: '25', value: '25' }
  ];

  connectedCallback() {
    this.loadComments();
    // listen for savecomment bubbled events
    this.addEventListener('savecomment', this.handleSaveComment.bind(this));
    this.addEventListener('commentsloaded', this.handleCommentsLoaded.bind(this));
  }

  handleSaveComment(event) {
    // event.detail contains comment payload; refresh list after a short delay
    setTimeout(() => this.loadComments(), 600);
  }

  handleCommentsLoaded(event) {
    const payload = event.detail;
    if (payload && Array.isArray(payload.comments)) {
      this.comments = payload.comments;
      this.totalCount = payload.totalCount || payload.comments.length;
    }
  }

  handleSearch(event) {
    this.searchText = event.target.value;
    this.pageNumber = 1;
    this.loadComments();
  }

  handlePageSizeChange(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.pageNumber = 1;
    this.loadComments();
  }

  async loadComments() {
    // Call Apex listComments to fetch comments for this record
    try {
      const result = await listComments({ caseId: this.recordId, pageNumber: this.pageNumber, pageSize: this.pageSize, searchText: this.searchText, channels: null, types: null, includeDrafts: false });
      // Map result into UI-friendly shapes
      const rows = (result || []).map(r => {
        return {
          Id: r.Id,
          Comment_Number__c: r.Comment_Number__c,
          Is_Draft__c: r.Is_Draft__c,
          Body__c: r.Body__c,
          Plain_Body__c: r.Plain_Body__c,
          Channel__c: r.Channel__c,
          CreatedDate: r.CreatedDate,
          Color_Class__c: r.Color_Class__c,
          CreatedBy: r.CreatedBy,
          AuthorName: r.CreatedBy ? r.CreatedBy.Name : null,
          // Attachments will be populated later when we add them
          Attachments: r.Attachments || null
        };
      });
      this.comments = rows;
      this.totalCount = this.comments.length;
    } catch (err) {
      // Fail softly and keep UI usable
      this.comments = [];
      this.totalCount = 0;
      // console log the error
      // eslint-disable-next-line no-console
      console.error('Failed to load comments', err);
      this.dispatchEvent(new ShowToastEvent({ title: 'Error loading comments', message: err && err.body && err.body.message ? err.body.message : (err.message || 'Server error'), variant: 'error' }));
    }
  }

  handlePrev() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadComments();
    }
  }

  handleNext() {
    this.pageNumber++;
    this.loadComments();
  }

  handleThumbVote(event) {
    // thumbs removed for now - noop
    return;
  }

  handleReplyEvent(event) {
    this.dispatchEvent(new CustomEvent('reply', { detail: event.detail, bubbles: true }));
  }

  handleEditEvent(event) {
    this.dispatchEvent(new CustomEvent('edit', { detail: event.detail, bubbles: true }));
  }

  get commentsCountLabel() {
    return `${this.totalCount || (this.comments ? this.comments.length : 0)} comments`;
  }

  get isPrevDisabled() {
    return this.pageNumber <= 1;
  }

  get isNextDisabled() {
    return !(this.comments && this.comments.length === this.pageSize);
  }

  @api
  prependComment(comment) {
    if (!comment) return;
    this.comments = [comment].concat(this.comments || []);
    this.totalCount = (this.totalCount || 0) + 1;
  }
}
