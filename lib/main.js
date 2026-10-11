"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const airmail_sort_button_1 = __importDefault(require("./airmail-sort-button"));
const sort_store_1 = __importDefault(require("./sort-store"));
const thread_list_sort_hook_1 = require("./thread-list-sort-hook");
function activate() {
    thread_list_sort_hook_1.installThreadListSortHook();
    sort_store_1.default.activate();
    mailspring_exports_1.ComponentRegistry.register(airmail_sort_button_1.default, {
        location: mailspring_exports_1.WorkspaceStore.Location.ThreadList.Toolbar,
    });
    thread_list_sort_hook_1.reloadThreadList();
}
exports.activate = activate;
function serialize() { }
exports.serialize = serialize;
function deactivate() {
    mailspring_exports_1.ComponentRegistry.unregister(airmail_sort_button_1.default);
    sort_store_1.default.deactivate();
}
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQXVFO0FBRXZFLGdGQUFzRDtBQUN0RCw4REFBcUM7QUFDckMsbUVBQXNGO0FBRXRGLFNBQWdCLFFBQVE7SUFDdEIsaURBQXlCLEVBQUUsQ0FBQztJQUM1QixvQkFBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRXJCLHNDQUFpQixDQUFDLFFBQVEsQ0FBQyw2QkFBaUIsRUFBRTtRQUM1QyxRQUFRLEVBQUUsbUNBQWMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU87S0FDckQsQ0FBQyxDQUFDO0lBRUgsd0NBQWdCLEVBQUUsQ0FBQztBQUNyQixDQUFDO0FBVEQsNEJBU0M7QUFFRCxTQUFnQixTQUFTLEtBQUksQ0FBQztBQUE5Qiw4QkFBOEI7QUFFOUIsU0FBZ0IsVUFBVTtJQUN4QixzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsNkJBQWlCLENBQUMsQ0FBQztJQUNoRCxvQkFBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3pCLENBQUM7QUFIRCxnQ0FHQyJ9