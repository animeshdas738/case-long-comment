public with sharing class EnhancedCommentSelector extends BaseSelector {

    public static List<Enhanced_Comment__c> selectForCase(Id caseId, Integer pageSize){
        List<String> fields = new List<String>{'Id','Comment_Number__c','Body__c','Plain_Body__c','Channel__c','Is_Public__c','CreatedById','CreatedDate'};
        List<String> whereClauses = new List<String>();
        if (caseId == null) whereClauses.add('Case__c = NULL');
        else whereClauses.add('Case__c = \'" + String.escapeSingleQuotes(String.valueOf(caseId)) + "\'');
        whereClauses.add('Status__c = \'Active\'');
        List<String> orderBy = new List<String>{'Comment_Number__c DESC'};

        String soql = (new EnhancedCommentSelector()).soqlBuilder('Enhanced_Comment__c', fields, whereClauses, true, orderBy, pageSize, false);
        List<sObject> raw = Database.query(soql);
        List<Enhanced_Comment__c> out = new List<Enhanced_Comment__c>();
        for (sObject s : raw) out.add((Enhanced_Comment__c)s);
        return out;
    }
}
