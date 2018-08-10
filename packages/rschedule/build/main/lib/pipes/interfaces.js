"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PipeRule = /** @class */ (function () {
    function PipeRule(controller) {
        this.controller = controller;
    }
    Object.defineProperty(PipeRule.prototype, "options", {
        get: function () {
            return this.controller.options;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeRule.prototype, "start", {
        get: function () {
            return this.controller.start;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeRule.prototype, "end", {
        get: function () {
            return this.controller.end;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeRule.prototype, "count", {
        get: function () {
            return this.controller.count;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeRule.prototype, "isIteratingInReverseOrder", {
        get: function () {
            return this.controller.isIteratingInReverseOrder;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeRule.prototype, "expandingPipes", {
        get: function () {
            return this.controller.expandingPipes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeRule.prototype, "focusedPipe", {
        get: function () {
            return this.controller.focusedPipe;
        },
        enumerable: true,
        configurable: true
    });
    PipeRule.prototype.cloneDateWithGranularity = function (date, granularity) {
        date = date.clone();
        switch (granularity) {
            case 'year':
                date.set('month', 1);
            case 'month':
                date.set('day', 1);
            case 'day':
                date.set('hour', 0);
            case 'hour':
                date.set('minute', 0);
            case 'minute':
                date.set('second', 0);
            case 'second':
                return date;
            default:
                throw 'Woops! the PipeController somehow has invalid options...';
        }
    };
    return PipeRule;
}());
exports.PipeRule = PipeRule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGlwZXMvaW50ZXJmYWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTRCQTtJQUdFLGtCQUFtQixVQUE4QjtRQUE5QixlQUFVLEdBQVYsVUFBVSxDQUFvQjtJQUFHLENBQUM7SUFFckQsc0JBQUksNkJBQU87YUFBWDtZQUNFLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUE7UUFDaEMsQ0FBQzs7O09BQUE7SUFDRCxzQkFBSSwyQkFBSzthQUFUO1lBQ0UsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQTtRQUM5QixDQUFDOzs7T0FBQTtJQUNELHNCQUFJLHlCQUFHO2FBQVA7WUFDRSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFBO1FBQzVCLENBQUM7OztPQUFBO0lBQ0Qsc0JBQUksMkJBQUs7YUFBVDtZQUNFLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUE7UUFDOUIsQ0FBQzs7O09BQUE7SUFDRCxzQkFBSSwrQ0FBeUI7YUFBN0I7WUFDRSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMseUJBQXlCLENBQUE7UUFDbEQsQ0FBQzs7O09BQUE7SUFDRCxzQkFBSSxvQ0FBYzthQUFsQjtZQUNFLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUE7UUFDdkMsQ0FBQzs7O09BQUE7SUFDRCxzQkFBSSxpQ0FBVzthQUFmO1lBQ0UsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQTtRQUNwQyxDQUFDOzs7T0FBQTtJQUVTLDJDQUF3QixHQUFsQyxVQUNFLElBQU8sRUFDUCxXQUFvRTtRQUVwRSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBRW5CLFFBQVEsV0FBVyxFQUFFO1lBQ25CLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN0QixLQUFLLE9BQU87Z0JBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDcEIsS0FBSyxLQUFLO2dCQUNSLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3JCLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN2QixLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDdkIsS0FBSyxRQUFRO2dCQUNYLE9BQU8sSUFBSSxDQUFBO1lBQ2I7Z0JBQ0UsTUFBTSwwREFBMEQsQ0FBQTtTQUNuRTtJQUNILENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQWxERCxJQWtEQztBQWxEcUIsNEJBQVEifQ==