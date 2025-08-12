import React, { useRef, useState } from 'react'
import { sidesDefault, weightsDefault, rollOne, normalizeDice, SymbolType } from '@shpoint/shared'

class NetClient {
  ws?: WebSocket
  onState: (s:any)=>void = ()=>{}
  onError: (m:string)=>void = ()=>{}
  connect(url = import.meta.env.VITE_WS_URL as string) {
    this.ws = new WebSocket(url)
    this.ws.onmessage = ev => {
      const msg = JSON.parse(ev.data)
      if (msg.t === 'state') this.onState(msg.state)
      if (msg.t === 'error') this.onError(msg.message)
    }
  }
  send(obj:any){ this.ws?.send(JSON.stringify(obj)) }
  join(room:string,name:string,idToken:string,role:'player'|'spectator'='player'){ this.send({t:'join',room,name,idToken,role}) }
  roll(){ this.send({t:'roll', pool:'attack'}) }
}

export default function App(){
  const [room,setRoom]=useState('ABC123')
  const [name,setName]=useState('Player')
  const [role,setRole]=useState<'player'|'spectator'>('player')
  const [idToken,setIdToken]=useState('') // paste from Google for now
  const [connected,setConnected]=useState(false)
  const [state,setState]=useState<any>(null)
  const [localRoll,setLocalRoll]=useState<SymbolType[]>([])
  const net = useRef<NetClient|null>(null)

  const ensure = ()=>{
    if (!net.current){ net.current = new NetClient(); net.current.onState=setState; net.current.onError=(m)=>alert(m); net.current.connect() }
    setConnected(true)
  }

  const doJoin = ()=>{ ensure(); net.current!.join(room,name,idToken,role) }
  const doServerRoll = ()=> net.current?.roll()

  const doLocalRoll = ()=>{
    const rolled: SymbolType[] = Array.from({length:7}, ()=> rollOne(sidesDefault, weightsDefault))
    setLocalRoll(rolled)
  }

  const serverDice = state?.dice

  return (
    <div style={{fontFamily:'system-ui, sans-serif', padding:16}}>
      <h1>Shatterpoint — Online MVP (Client)</h1>

      <section style={{border:'1px solid #ddd', padding:12, borderRadius:8, marginBottom:12}}>
        <h3>Online</h3>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <input placeholder="Room" value={room} onChange={e=>setRoom(e.target.value)} />
          <select value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="player">player</option>
            <option value="spectator">spectator</option>
          </select>
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Paste Google ID token (dev)" value={idToken} onChange={e=>setIdToken(e.target.value)} style={{width:420}}/>
          <button onClick={doJoin}>Join room</button>
          <button onClick={doServerRoll} disabled={!connected}>Roll (server)</button>
        </div>
        <div style={{marginTop:8, fontSize:12, color:'#555'}}>Set VITE_WS_URL in client env. Google token required by server (paste for now).</div>
      </section>

      <section style={{border:'1px solid #ddd', padding:12, borderRadius:8, marginBottom:12}}>
        <h3>Server dice</h3>
        {serverDice ? (
          <>
            <div>Rolled: {serverDice.rolled?.join(', ')}</div>
            <div>Success: {serverDice.success} | Crit: {serverDice.crit} | Seed: {serverDice.seed}</div>
          </>
        ) : <div>No server roll yet.</div>}
      </section>

      <section style={{border:'1px solid #ddd', padding:12, borderRadius:8}}>
        <h3>Local dice (demo)</h3>
        <button onClick={doLocalRoll}>Roll locally</button>
        <div>{localRoll.join(', ')}</div>
        <div>normalize: {(() => { const d = normalizeDice(localRoll, [{threshold:1, addSuccess:1}]); return `success=${d.success}, crit=${d.crit}` })()}</div>
      </section>
    </div>
  )
}
