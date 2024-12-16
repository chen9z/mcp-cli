import { StdioClientTransport, Client } from '@modelcontextprotocol/sdk';

export class MCPClient {
    async connect(name:string,command:string,args:string[]){
        const transport = new StdioClientTransport({
            command,
            args
        });
        const client = new Client();
        await client.connect(transport);
    }
}