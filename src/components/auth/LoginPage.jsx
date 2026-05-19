import { useState } from "react";
import { loginUser, getUsers, saveUsers } from "../../utils/auth.js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "mhtransport2024";

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const[username,setUsername]=useState("");
  const[password,setPassword]=useState("");
  const[showPass,setShowPass]=useState(false);
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);

  const login=async()=>{
    if(!username||!password){setError("ইউজারনেম ও পাসওয়ার্ড দিন");return;}
    setLoading(true);
    setError("");
    try {
      // Step 1: Fetch fresh users from Sheets
      const sheetUsers = await GS.getAll("Users");
      let allUsers;
      if(sheetUsers && sheetUsers.length > 0){
        allUsers = sheetUsers.map(u=>({
          id: String(u.id||""),
          username: String(u.username||"").trim(),
          password: String(u.password||"").trim(),
          name: String(u.name||""),
          role: String(u.role||"viewer"),
          active: u.active==="true"||u.active===true,
        })).filter(u=>u.id&&u.username&&u.password);
        // Update localStorage with fresh data
        LS.set("mht_users", allUsers);
      } else {
        // Fallback to localStorage
        allUsers = getUsers();
      }
      // Step 2: Find matching user
      const uname = username.trim();
      const upass = password.trim();
      const user = allUsers.find(u=>
        u.username===uname && u.password===upass && u.active===true
      );
      if(user){
        LS.set("mht_session",{userId:user.id,loginTime:Date.now()});
        onLogin(user);
      } else {
        // Check if user exists but wrong password
        const exists = allUsers.find(u=>u.username===uname);
        if(exists && !exists.active){
          setError("এই অ্যাকাউন্ট নিষ্ক্রিয়। Admin-এর সাথে যোগাযোগ করুন।");
        } else {
          setError("ইউজারনেম বা পাসওয়ার্ড ভুল!");
        }
      }
    } catch(err) {
      // Offline fallback
      const allUsers = getUsers();
      const user = allUsers.find(u=>
        u.username===username.trim() && u.password===password.trim() && u.active===true
      );
      if(user){
        LS.set("mht_session",{userId:user.id,loginTime:Date.now()});
        onLogin(user);
      } else {
        setError("লগইন ব্যর্থ। ইন্টারনেট চেক করুন অথবা পাসওয়ার্ড যাচাই করুন।");
      }
    }
    setLoading(false);
  };

  // Password recovery
  const[showRecovery,setShowRecovery]=useState(false);
  const[recUsername,setRecUsername]=useState("");
  const[recNewPass,setRecNewPass]=useState("");
  const[recSecretKey,setRecSecretKey]=useState("");
  const[recMsg,setRecMsg]=useState("");
  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "mhtransport2024";

  const recover=()=>{
    if(!recUsername||!recNewPass||!recSecretKey){setRecMsg("সব তথ্য পূরণ করুন");return;}
    if(recSecretKey!==SECRET_KEY){setRecMsg("সিক্রেট কী ভুল! মালিকের সাথে যোগাযোগ করুন।");return;}
    const users=getUsers();
    const uname=recUsername.trim();
    const user=users.find(u=>u.username===uname);
    if(!user){setRecMsg("এই ইউজারনেম পাওয়া যায়নি");return;}
    const updated=users.map(u=>u.username===uname?{...u,password:recNewPass.trim()}:u);
    saveUsers(updated);
    setRecMsg("✅ পাসওয়ার্ড পরিবর্তন হয়েছে! এখন লগইন করুন।");
    setTimeout(()=>{setShowRecovery(false);setRecMsg("");setRecUsername("");setRecNewPass("");setRecSecretKey("");},2000);
  };

  return(
    <div style={{minHeight:"100vh",background:"var(--navy-950)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans Bengali',sans-serif;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse-green{0%,100%{box-shadow:0 0 0 0 rgba(15,186,129,0.4);}50%{box-shadow:0 0 0 8px rgba(15,186,129,0);}}
      `}</style>

      {/* Background decoration */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-20%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"rgba(15,186,129,0.04)",filter:"blur(80px)"}}/>
        <div style={{position:"absolute",bottom:"-20%",left:"-10%",width:400,height:400,borderRadius:"50%",background:"rgba(29,52,97,0.3)",filter:"blur(60px)"}}/>
      </div>

      <div style={{width:"100%",maxWidth:400,animation:"fadeUp 0.5s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 32px rgba(15,186,129,0.3)",animation:"pulse-green 3s ease infinite"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#020c1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>M.H. Transport</h1>
          <p style={{fontSize:13,color:"var(--green-500)",fontWeight:600}}>ম্যানেজমেন্ট সিস্টেম</p>
        </div>

        {/* Login Card */}
        <div style={{background:"rgba(17,34,64,0.9)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:20,padding:28,backdropFilter:"blur(16px)",boxShadow:"0 24px 80px rgba(2,12,27,0.6)"}}>
          <h2 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:22,textAlign:"center"}}>লগইন করুন</h2>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>ইউজারনেম</span>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="আপনার ইউজারনেম"
                onKeyDown={e=>e.key==="Enter"&&login()}
                style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"11px 14px",outline:"none",fontSize:14,transition:"border-color 0.2s",fontFamily:"'Noto Sans Bengali',sans-serif"}}
                onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>পাসওয়ার্ড</span>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="পাসওয়ার্ড"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"11px 44px 11px 14px",outline:"none",fontSize:14,width:"100%",transition:"border-color 0.2s",fontFamily:"'Noto Sans Bengali',sans-serif"}}
                  onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                  onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:12,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
                  {showPass?"লুকান":"দেখান"}
                </button>
              </div>
            </div>

            {error&&(
              <div style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--danger)",textAlign:"center"}}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={login} disabled={loading}
              style={{background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",color:"#020c1b",border:"none",borderRadius:12,padding:"13px 20px",fontSize:14,fontWeight:800,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,transition:"all 0.18s",marginTop:4,fontFamily:"'Noto Sans Bengali',sans-serif"}}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.filter="brightness(1.1)")}
              onMouseLeave={e=>(e.currentTarget.style.filter="")}>
              {loading?"লগইন হচ্ছে...":"লগইন করুন →"}
            </button>
          </div>

          <p style={{textAlign:"center",fontSize:11,color:"var(--text-muted)",marginTop:18}}>
            ডিফল্ট: username: <strong style={{color:"var(--green-400)"}}>admin</strong> · password: <strong style={{color:"var(--green-400)"}}>admin123</strong>
          </p>
          <div style={{textAlign:"center",marginTop:12}}>
            <button onClick={()=>setShowRecovery(true)} style={{background:"none",border:"none",color:"var(--green-500)",fontSize:12,cursor:"pointer",fontFamily:"'Noto Sans Bengali',sans-serif",textDecoration:"underline"}}>
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          </div>
        </div>

        {/* Recovery Modal */}
        {showRecovery&&(
          <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowRecovery(false)}>
            <div style={{position:"absolute",inset:0,background:"rgba(2,12,27,0.85)",backdropFilter:"blur(6px)"}}/>
            <div style={{position:"relative",width:"100%",maxWidth:380,background:"var(--navy-800)",border:"1px solid rgba(100,255,218,0.15)",borderRadius:20,padding:28,boxShadow:"0 24px 80px rgba(2,12,27,0.8)"}} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontWeight:800,fontSize:16,color:"var(--green-300)",marginBottom:6,textAlign:"center"}}>🔑 পাসওয়ার্ড রিকভারি</h3>
              <p style={{fontSize:12,color:"var(--text-secondary)",textAlign:"center",marginBottom:20}}>সিক্রেট কী দিয়ে পাসওয়ার্ড রিসেট করুন</p>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>ইউজারনেম</span>
                  <input value={recUsername} onChange={e=>setRecUsername(e.target.value)} placeholder="আপনার ইউজারনেম"
                    style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"10px 14px",outline:"none",fontSize:13,fontFamily:"'Noto Sans Bengali',sans-serif"}}
                    onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                    onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>নতুন পাসওয়ার্ড</span>
                  <input type="password" value={recNewPass} onChange={e=>setRecNewPass(e.target.value)} placeholder="নতুন পাসওয়ার্ড"
                    style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"10px 14px",outline:"none",fontSize:13,fontFamily:"'Noto Sans Bengali',sans-serif"}}
                    onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                    onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>সিক্রেট কী</span>
                  <input type="password" value={recSecretKey} onChange={e=>setRecSecretKey(e.target.value)} placeholder="মালিকের কাছ থেকে নিন"
                    style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"10px 14px",outline:"none",fontSize:13,fontFamily:"'Noto Sans Bengali',sans-serif"}}
                    onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                    onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                </div>
                {recMsg&&(
                  <div style={{background:recMsg.includes("✅")?"rgba(15,186,129,0.1)":"rgba(255,107,107,0.1)",border:`1px solid ${recMsg.includes("✅")?"rgba(15,186,129,0.3)":"rgba(255,107,107,0.25)"}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:recMsg.includes("✅")?"var(--green-400)":"var(--danger)",textAlign:"center"}}>
                    {recMsg}
                  </div>
                )}
                <button onClick={recover}
                  style={{background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",color:"#020c1b",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:800,cursor:"pointer",marginTop:4,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
                  পাসওয়ার্ড রিসেট করুন
                </button>
                <button onClick={()=>setShowRecovery(false)}
                  style={{background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"10px",fontSize:13,color:"var(--text-secondary)",cursor:"pointer",fontFamily:"'Noto Sans Bengali',sans-serif"}}>
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



export default LoginPage;
