public with sharing class EnhancedCommentSelector extends BaseSelector {
    private static final List<String> FIELDS = new List<String>{'Id','Comment_Number__c','Body__c','Plain_Body__c','Channel__c','Is_Public__c','Is_Draft__c','CreatedById','CreatedDate','Color_Class__c','CreatedBy.Name','Case__c'};

    public static List<Enhanced_Comment__c> selectForCase(Id caseId, Integer pageSize){
        List<String> whereClauses = new List<String>();
    if (caseId == null) whereClauses.add('Case__c = NULL');
    else whereClauses.add('Case__c = \'' + String.escapeSingleQuotes(String.valueOf(caseId)) + '\'');
    // Include all comments except those soft-deleted or archived (Status__c = 'Deleted' or 'Archived')
    whereClauses.add('Status__c != \'Deleted\'');
    whereClauses.add('Status__c != \'Archived\'');
        List<String> orderBy = new List<String>{'Comment_Number__c DESC'};
        String soql = (new EnhancedCommentSelector()).soqlBuilder('Enhanced_Comment__c', FIELDS, whereClauses, true, orderBy, pageSize, false);
        List<sObject> raw = Database.query(soql);
        List<Enhanced_Comment__c> out = new List<Enhanced_Comment__c>();
        for (sObject s : raw) out.add((Enhanced_Comment__c)s);
        return out;
    }

    public static Enhanced_Comment__c selectById(Id commentId){
        if (commentId == null) return null;
        List<String> whereClauses = new List<String>();
            whereClauses.add('Id = \'' + String.escapeSingleQuotes(String.valueOf(commentId)) + '\'');
    whereClauses.add('Status__c != \'Deleted\'');
    whereClauses.add('Status__c != \'Archived\'');
        String soql = (new EnhancedCommentSelector()).soqlBuilder('Enhanced_Comment__c', FIELDS, whereClauses, true, null, 1, false);
        List<sObject> raw = Database.query(soql);
        if (raw.isEmpty()) return null;
        return (Enhanced_Comment__c)raw[0];
    }
}
