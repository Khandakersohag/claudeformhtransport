import { useState, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, IconBtn, I } from "../common/ui.jsx";
import { ROLES, getUsers, saveUsers, syncUsersFromSheets } from "../../utils/auth.js";
import GS from "../../services/gs.js";

// ─── User Management (Admin only) ─────────────────────────────────────────────
function UserManagement({currentUser}){
  const[users,setUsers]=useState(()=>getUsers());
  useEffect(()=>{
    // Sync from Sheets on mount
    syncUsersFromSheets().then(fresh=>setUsers([...fresh]));
  },[]);
  const[showAdd,setShowAdd]=useState(false);
  const[uName,setUName]=useState("");
  const[uUsername,setUUsername]=useState("");
  const[uPass,setUPass]=useState("");
  const[uRole,setURole]=useState("manager");
  const[editId,setEditId]=useState(null);
  const[error,setError]=useState("");

  const reset=()=>{setUName("");setUUsername("");setUPass("");setURole("manager");setEditId(null);setShowAdd(false);setError("");};

  const save=()=>{
    if(!uName||!uUsername||(!editId&&!uPass)){setError("সব তথ্য পূরণ করুন");return;}
    const existing=users.find(u=>u.username===uUsername&&u.id!==editId);
    if(existing){setError("এই ইউজারনেম ইতিমধ্যে আছে");return;}
    let list;
    if(editId){
      list=users.map(u=>u.id===editId?{...u,name:uName,username:uUsername,...(uPass?{password:uPass}:{}),role:uRole}:u);
    } else {
      const newUser={id:Date.now().toString(),username:uUsername,password:uPass,name:uName,role:uRole,active:true};
      list=[...users,newUser];
    }
    saveUsers(list);
    setUsers([...list]);
    reset();
  };

  const toggleActive=(id)=>{
    if(id===currentUser.id){alert("নিজের অ্যাকাউন্ট বন্ধ করা যাবে না!");return;}
    const list=users.map(u=>u.id===id?{...u,active:!u.active}:u);
    saveUsers(list);
    setUsers([...list]);
  };

  const deleteUser=(id)=>{
    if(id===currentUser.id){alert("নিজের অ্যাকাউন্ট মুছা যাবে না!");return;}
    if(!confirm("এই ইউজার মুছে ফেলবেন?"))return;
    const list=users.filter(u=>u.id!==id);
    saveUsers(list);
    setUsers([...list]);
  };

  const loadEdit=(u)=>{setUName(u.name);setUUsername(u.username);setUPass("");setURole(u.role);setEditId(u.id);setShowAdd(true);};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>ইউজার ম্যানেজমেন্ট 👤</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>ব্যবহারকারী ও অ্যাক্সেস নিয়ন্ত্রণ</p></div>
        <Btn onClick={()=>setShowAdd(true)} icon={<I.Plus/>}>নতুন ইউজার</Btn>
      </div>

      {/* Role info */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}} className="fu1">
        {Object.entries(ROLES).map(([key,r])=>(
          <Card key={key} style={{padding:"14px 16px"}}>
            <Pill color={r.color}>{r.label}</Pill>
            <p style={{fontSize:11,color:"var(--text-secondary)",marginTop:8,lineHeight:1.6}}>
              {key==="admin"?"সব কিছু দেখা ও পরিবর্তন করতে পারবে":key==="manager"?"এন্ট্রি দিতে পারবে, ডিলিট করতে পারবে না":"শুধু দেখতে পারবে"}
            </p>
          </Card>
        ))}
      </div>

      <Card className="fu2" style={{padding:22}}>
        <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>ইউজার তালিকা ({users.length} জন)</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {users.map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,background:"rgba(2,12,27,0.5)",border:`1px solid ${u.id===currentUser.id?"rgba(15,186,129,0.2)":"rgba(100,255,218,0.08)"}`,borderRadius:12,padding:"12px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:u.active?"linear-gradient(135deg,var(--green-500),#0d9e6e)":"var(--navy-700)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:u.active?"#020c1b":"var(--text-muted)",flexShrink:0}}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <p style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{u.name}</p>
                    {u.id===currentUser.id&&<Pill color="green">আপনি</Pill>}
                  </div>
                  <p style={{fontSize:12,color:"var(--text-secondary)"}}>@{u.username} · <span style={{color:ROLES[u.role].color==="green"?"var(--green-400)":ROLES[u.role].color==="amber"?"var(--amber)":"#6495ed"}}>{ROLES[u.role].label}</span></p>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <Pill color={u.active?"green":"slate"}>{u.active?"সক্রিয়":"নিষ্ক্রিয়"}</Pill>
                <Btn v="ghost" size="sm" onClick={()=>loadEdit(u)} icon={<I.Edit/>}>সম্পাদনা</Btn>
                {u.id!==currentUser.id&&(
                  <>
                    <Btn v="navy" size="sm" onClick={()=>toggleActive(u.id)}>{u.active?"বন্ধ করুন":"চালু করুন"}</Btn>
                    <IconBtn icon={<I.Trash/>} onClick={()=>deleteUser(u.id)}/>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={showAdd} onClose={reset} title={editId?"ইউজার সম্পাদনা":"নতুন ইউজার যোগ করুন"}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="পূর্ণ নাম" value={uName} onChange={setUName} placeholder="মো. রহিম"/>
          <Field label="ইউজারনেম" value={uUsername} onChange={setUUsername} placeholder="rahim123"/>
          <Field label={editId?"নতুন পাসওয়ার্ড (খালি রাখলে পুরনোটা থাকবে)":"পাসওয়ার্ড"} type="password" value={uPass} onChange={setUPass} placeholder="••••••••"/>
          <Sel label="রোল" value={uRole} onChange={setURole} options={Object.entries(ROLES).map(([v,r])=>({value:v,label:r.label}))}/>
          {error&&<div style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"var(--danger)"}}>{error}</div>}
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <Btn onClick={save} icon={<I.Save/>} full>{editId?"আপডেট করুন":"যোগ করুন"}</Btn>
            <Btn v="ghost" onClick={reset} full>বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}



export default UserManagement;
