@isTest
private class EnhancedCommentControllerTest {
    @isTest static void testCreateAndList() {
        // Create a Case
        Case c = new Case(Subject='Test Case for Enhanced Comment', Status='New');
        insert c;

        // Create a comment via controller
        Id createdId = EnhancedCommentController.createComment(String.valueOf(c.Id), null, '<p>hello</p>', 'hello', true, false, 'Case Comment', 'Note');
        System.assertNotEquals(null, createdId);

        // List comments
        List<Enhanced_Comment__c> list = EnhancedCommentController.listComments(c.Id, 1, 10, null, null, null, false);
        System.assert(list.size() > 0);
    }
}
