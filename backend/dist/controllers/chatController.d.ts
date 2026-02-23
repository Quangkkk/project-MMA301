import { Request, Response } from 'express';
declare class ChatController {
    getConversations(req: Request, res: Response): Promise<any>;
    createOrGetConversation(req: Request, res: Response): Promise<any>;
    getMessages(req: Request, res: Response): Promise<any>;
    sendMessage(req: Request, res: Response): Promise<any>;
    markAsRead(req: Request, res: Response): Promise<any>;
}
declare const _default: ChatController;
export default _default;
//# sourceMappingURL=chatController.d.ts.map