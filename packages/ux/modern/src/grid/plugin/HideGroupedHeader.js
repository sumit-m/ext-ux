Ext.define('Ext.ux.grid.plugin.HideGroupedHeader', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.hidegroupedheader',
    
    config: {
        hideGroupedHeader: true
    },

    init: function(grid) {
        var me = this;
        var store = grid.getStore();

        // override applyGrouper() to access the previous grouper value, and unhide the previous grouped header
        store.applyGrouper = function(grouper) {
            var columns = grid.getColumns();
            var previousGrouper = store.getGrouper();
            var property = grouper ? (grouper.getProperty ? grouper.getProperty() : grouper.property) : null; 
            
            Ext.Array.each(columns, function(column, index, allItems) {
                if(previousGrouper && (column.getDataIndex() === previousGrouper.getProperty())) {
                    column.show();
                }
                
                if(grouper && (column.getDataIndex() === property)) {
                    if(typeof(grid.getHideGroupedHeader) === 'function') {
                        if(grid.getHideGroupedHeader()) {
                            column.hide();
                        }                        
                    } else if(this.getHideGroupedHeader()) {
                        column.hide();
                    }
                }
            }, me);

            return store.superclass.applyGrouper.call(store, grouper);
        }
    }
});