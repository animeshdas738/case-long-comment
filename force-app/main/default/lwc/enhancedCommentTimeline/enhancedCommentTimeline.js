import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import listComments from '@salesforce/apex/EnhancedCommentController.listComments';
import publishComment from '@salesforce/apex/EnhancedCommentController.publishComment';
import setCommentPublic from '@salesforce/apex/EnhancedCommentController.setCommentPublic';
import archiveComment from '@salesforce/apex/EnhancedCommentController.archiveComment';

export default class EnhancedCommentTimeline extends LightningElement {
  @api recordId;
  @track comments = [];
  @track pageSize = 5;
  pageNumber = 1;
  searchText = '';
  totalCount = 0;
  loading = false;
  hasMore = true;

  pageSizeOptions = [
    { label: '5', value: '5' },
    { label: '10', value: '10' },
    { label: '25', value: '25' }
  ];

  connectedCallback() {
    this.loadComments(false);
    // listen for savecomment bubbled events
    this.addEventListener('savecomment', this.handleSaveComment.bind(this));
    this.addEventListener('commentsloaded', this.handleCommentsLoaded.bind(this));
    // listen for publish and togglepublic events from item children
    this.addEventListener('publish', this.handlePublishEvent.bind(this));
    this.addEventListener('togglepublic', this.handleTogglePublicEvent.bind(this));
  this.addEventListener('archive', this.handleArchiveEvent.bind(this));
    // attach scroll listener after render
    // use a small timeout to ensure DOM is available
    setTimeout(() => {
      const container = this.template.querySelector('.comments-list');
      if (container) {
        container.addEventListener('scroll', this._onScrollBound = this._onScroll.bind(this));
      }
    }, 200);
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
    this.hasMore = true;
    this.loadComments(false);
  }

  handlePageSizeChange(event) {
    // keep pageSize but reset pagination
    this.pageSize = parseInt(event.target.value, 10);
    this.pageNumber = 1;
    this.hasMore = true;
    this.loadComments(false);
  }

  async loadComments() {
    // Call Apex listComments to fetch comments for this record
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    try {
      const result = await listComments({ caseId: this.recordId, pageNumber: this.pageNumber, pageSize: this.pageSize, searchText: this.searchText, channels: null, types: null, includeDrafts: false });
      const rows = (result || []).map(r => ({
        Id: r.Id,
        Comment_Number__c: r.Comment_Number__c,
        Is_Draft__c: r.Is_Draft__c,
        Is_Public__c: r.Is_Public__c,
        Body__c: r.Body__c,
        Plain_Body__c: r.Plain_Body__c,
        Channel__c: r.Channel__c,
        CreatedDate: r.CreatedDate,
        Color_Class__c: r.Color_Class__c,
        CreatedBy: r.CreatedBy,
        AuthorName: r.CreatedBy ? r.CreatedBy.Name : null,
        Attachments: r.Attachments || null
      }));

      if (this.pageNumber === 1) {
        this.comments = rows;
      } else {
        this.comments = (this.comments || []).concat(rows);
      }

      // If fewer results returned than pageSize, no more data
      if (!rows || rows.length < this.pageSize) {
        this.hasMore = false;
      } else {
        this.pageNumber++;
      }

      this.totalCount = this.comments.length;
    } catch (err) {
      // Fail softly and keep UI usable
      // eslint-disable-next-line no-console
      console.error('Failed to load comments', err);
      this.dispatchEvent(new ShowToastEvent({ title: 'Error loading comments', message: err && err.body && err.body.message ? err.body.message : (err.message || 'Server error'), variant: 'error' }));
    } finally {
      this.loading = false;
    }
  }

  handlePrev() {
    // pagination disabled in lazy loading mode
  }

  handleNext() {
    // pagination disabled in lazy loading mode
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

  async handlePublishEvent(event) {
    const commentId = event.detail && event.detail.commentId;
    if (!commentId) return;
    try {
      const updated = await publishComment({ commentId });
      this._replaceCommentInList(updated);
      this.dispatchEvent(new ShowToastEvent({ title: 'Published', message: 'Comment published', variant: 'success' }));
    } catch (err) {
      this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: err && err.body && err.body.message ? err.body.message : (err.message || 'Server error'), variant: 'error' }));
    }
  }

  async handleTogglePublicEvent(event) {
    const payload = event.detail || {};
    const commentId = payload.commentId;
    const isPublic = payload.isPublic;
    if (!commentId || typeof isPublic !== 'boolean') return;
    try {
      const updated = await setCommentPublic({ commentId, isPublic });
      this._replaceCommentInList(updated);
      this.dispatchEvent(new ShowToastEvent({ title: 'Updated', message: `Comment marked ${isPublic ? 'public' : 'private'}`, variant: 'success' }));
    } catch (err) {
      this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: err && err.body && err.body.message ? err.body.message : (err.message || 'Server error'), variant: 'error' }));
    }
  }

  _replaceCommentInList(srvRecord) {
    if (!srvRecord || !srvRecord.Id) return;
    const mapped = {
      Id: srvRecord.Id,
      Comment_Number__c: srvRecord.Comment_Number__c,
      Is_Draft__c: srvRecord.Is_Draft__c,
      Is_Public__c: srvRecord.Is_Public__c,
      Body__c: srvRecord.Body__c,
      Plain_Body__c: srvRecord.Plain_Body__c,
      Channel__c: srvRecord.Channel__c,
      CreatedDate: srvRecord.CreatedDate,
      Color_Class__c: srvRecord.Color_Class__c,
      CreatedBy: srvRecord.CreatedBy,
      AuthorName: srvRecord.CreatedBy ? srvRecord.CreatedBy.Name : null,
      Attachments: srvRecord.Attachments || null
    };
    const idx = this.comments.findIndex(c => c.Id === mapped.Id);
    if (idx >= 0) {
      const copy = this.comments.slice();
      copy[idx] = mapped;
      this.comments = copy;
    } else {
      // if not present, prepend
      this.prependComment(mapped);
    }
  }

  async handleArchiveEvent(event) {
    const commentId = event.detail && event.detail.commentId;
    if (!commentId) return;
    try {
      await archiveComment({ commentId });
      // remove from list
      this.comments = this.comments.filter(c => c.Id !== commentId);
      this.totalCount = Math.max(0, (this.totalCount || 0) - 1);
      this.dispatchEvent(new ShowToastEvent({ title: 'Archived', message: 'Comment archived', variant: 'success' }));
    } catch (err) {
      this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: err && err.body && err.body.message ? err.body.message : (err.message || 'Server error'), variant: 'error' }));
    }
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

  _onScroll(e) {
    try {
      const el = e.target;
      if (!el) return;
      const threshold = 80;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
        // load more
        this.loadComments();
      }
    } catch (err) {
      // ignore
    }
  }

  disconnectedCallback() {
    if (this._onScrollBound) {
      const container = this.template && this.template.querySelector && this.template.querySelector('.comments-list');
      if (container) container.removeEventListener('scroll', this._onScrollBound);
      this._onScrollBound = null;
    }
  }
}
