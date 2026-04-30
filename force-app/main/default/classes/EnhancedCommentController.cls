public with sharing class EnhancedCommentController {
    @AuraEnabled(cacheable=true)
    public static List<Enhanced_Comment__c> listComments(Id caseId, Integer pageNumber, Integer pageSize, String searchText, List<String> channels, List<String> types, Boolean includeDrafts) {
        // Delegate to selector for now
        Integer effectivePageSize = (pageSize == null || pageSize <= 0) ? 20 : pageSize;
        return EnhancedCommentSelector.selectForCase(caseId, effectivePageSize);
    }

    @AuraEnabled
    public static Id createComment(String caseId, String parentCommentId, String bodyHtml, String bodyPlain, Boolean isPublic, Boolean isDraft, String channel, String type) {
        // Implement atomic per-case counter using SELECT ... FOR UPDATE
        Integer nextNumber = null;
        try {
            if (caseId != null) {
                Case c = [SELECT Id, Last_Comment_Number__c FROM Case WHERE Id = :caseId LIMIT 1 FOR UPDATE];
                Integer last = (c.Last_Comment_Number__c == null) ? 0 : Integer.valueOf(c.Last_Comment_Number__c);
                nextNumber = last + 1;
                c.Last_Comment_Number__c = nextNumber;
                update c;
            }

            Enhanced_Comment__c ec = new Enhanced_Comment__c(
                Case__c = caseId,
                Parent_Comment__c = parentCommentId,
                Body__c = bodyHtml,
                Plain_Body__c = bodyPlain,
                Channel__c = channel,
                Type__c = type,
                Is_Public__c = isPublic,
                Is_Draft__c = isDraft,
                Comment_Number__c = nextNumber
            );
            insert ec;
            return ec.Id;
        } catch (Exception e) {
            // Re-throw as Aura-friendly exception
            throw new AuraHandledException('Unable to create comment: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static Id createCommentWithAttachments(String caseId, String parentCommentId, String bodyHtml, String bodyPlain, Boolean isPublic, Boolean isDraft, String channel, String type, List<Id> contentDocumentIds) {
        Id ecId = createComment(caseId, parentCommentId, bodyHtml, bodyPlain, isPublic, isDraft, channel, type);
        if (contentDocumentIds != null && !contentDocumentIds.isEmpty()) {
            List<ContentDocumentLink> links = new List<ContentDocumentLink>();
            for (Id docId : contentDocumentIds) {
                links.add(new ContentDocumentLink(ContentDocumentId = docId, LinkedEntityId = ecId, ShareType = 'I', Visibility = 'AllUsers'));
            }
            try {
                insert links;
            } catch (Exception e) {
                // non-blocking: log but do not fail the entire create
                System.debug('Failed to link attachments: ' + e.getMessage());
            }
        }
        return ecId;
    }

    @AuraEnabled(cacheable=true)
    public static Enhanced_Comment__c getCommentById(Id commentId) {
        if (commentId == null) return null;
        return EnhancedCommentSelector.selectById(commentId);
    }
}
