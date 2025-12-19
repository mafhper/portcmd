import si from 'systeminformation';
import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

export function detectType(p) {
    const name = p.name.toLowerCase();
    const cmd = p.command.toLowerCase();

    if (name.includes('node') || cmd.includes('npm') || cmd.includes('yarn') || cmd.includes('bun') || cmd.includes('vite') || cmd.includes('deno')) return 'Development';
    if (name.includes('java')) return 'Java';
    if (name.includes('python')) return 'Python';
    if (name.includes('postgres')) return 'Database';
    if (name.includes('docker')) return 'Container';
    return 'System';
}

export function mapState(state) {
    if (!state) return 'Running';
    const s = state.toLowerCase();
    if (s === 'running' || s === 'sleeping' || s === 'unknown') return 'Running';
    if (s === 'blocked' || s === 'suspended') return 'Suspended';
    if (s === 'zombie') return 'Zombie';
    return 'Running';
}

export async function getNetstatConnections() {
    if (process.platform !== 'win32') return [];
    try {
        const { stdout } = await execPromise('netstat -ano');
        const lines = stdout.split('\n');
        const connections = [];
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5 && parts[0].startsWith('TCP') && parts[3] === 'LISTENING') {
                const localAddr = parts[1];
                const pid = parseInt(parts[4]);
                const lastColon = localAddr.lastIndexOf(':');
                const port = parseInt(localAddr.substring(lastColon + 1));
                const address = localAddr.substring(0, lastColon);
                if (!isNaN(pid) && !isNaN(port)) {
                    connections.push({ pid, localPort: port, localAddress: address, state: 'LISTEN' });
                }
            }
        }
        return connections;
    } catch (e) {
        console.error('Netstat failed', e);
        return [];
    }
}

export async function getSystemProcesses(projectsLoadFn, runtimeState) {
    const [processes, network, netstat, projects] = await Promise.all([
        si.processes(),
        si.networkConnections(),
        getNetstatConnections(),
        projectsLoadFn()
    ]);

    // Map managed PIDs from runtime state
    const managedPids = new Map();
    // Helper function to access project state - assuming runtimeState is passed or accessible
    // In this refactor, we might need to pass the state map or a getter

    projects.forEach(p => {
        // We need a way to check if project is running from here, 
        // or we passed the enriched projects list. 
        // For now, let's assume the state logic is handled in the controller or service composition.
        // Refactoring Note: This dependency on 'runtimeState' suggests ProcessService needs access to ProjectService's state.
        // We will solve this by passing the necessary data.
    });

    // ... Logic to be refined in the composition step. 
    // For now, exporting the raw gatherers.
    return { processes, network, netstat };
}
