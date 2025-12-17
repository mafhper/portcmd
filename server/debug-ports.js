import si from 'systeminformation';

async function debug() {
  console.log('--- DEBUG START ---');
  
  console.log('1. Fetching Network Connections...');
  const network = await si.networkConnections();
  const listening = network.filter(c => c.state === 'LISTEN');
  console.log(`   Found ${listening.length} listening ports.`);
  
  const port3001 = listening.find(c => c.localPort === '3001' || c.localPort === 3001);
  if (port3001) {
    console.log('   ✅ Port 3001 (Backend) FOUND:', JSON.stringify(port3001));
  } else {
    console.log('   ❌ Port 3001 (Backend) NOT FOUND in network connections.');
  }

  console.log('\n2. Fetching Processes...');
  const processes = await si.processes();
  console.log(`   Found ${processes.list.length} processes.`);
  
  if (port3001) {
    const proc = processes.list.find(p => p.pid === port3001.pid);
    if (proc) {
      console.log(`   ✅ Process match for Port 3001: PID ${proc.pid} is "${proc.name}"`);
    } else {
      console.log(`   ❌ PID ${port3001.pid} from network NOT FOUND in process list.`);
    }
  }

  console.log('\n3. Simulating Server Logic (Map Construction)...');
  const portMap = new Map();
  listening.forEach(conn => {
    if (conn.pid) {
      if (!portMap.has(conn.pid)) portMap.set(conn.pid, []);
      portMap.get(conn.pid).push(conn.localPort);
    }
  });
  console.log(`   Mapped ${portMap.size} PIDs to ports.`);

  const matched = processes.list.filter(p => portMap.has(p.pid));
  console.log(`   Matched ${matched.length} processes with ports.`);
  
  console.log('\n--- TOP 5 MATCHED PROCESSES ---');
  matched.slice(0, 5).forEach(p => {
    console.log(`   [${p.pid}] ${p.name} -> Ports: ${portMap.get(p.pid).join(', ')}`);
  });

  console.log('--- DEBUG END ---');
}

debug().catch(console.error);