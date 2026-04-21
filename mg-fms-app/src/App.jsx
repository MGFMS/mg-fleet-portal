import React from 'react'
import { createPortal } from 'react-dom'
import { login, logout, onAuth, getAssessments, getPMSRecords, saveAssessment, updateAssessment, savePMSRecord, onAssessmentsSnapshot, onPMSRecordsSnapshot, waitForAuthToken, getUserProfile, saveUserProfile, getAllUsers, deletePMSRecord, deleteAssessmentsByPlate } from './firebase'
import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ROLES={technician:{label:"Technician",color:"bg-blue-100 text-blue-700"},supervisor:{label:"Supervisor",color:"bg-amber-100 text-amber-700"},fleet_manager:{label:"Fleet Manager",color:"bg-red-100 text-red-700"}};
const canAccess=(role,feature)=>{if(!role)return false;if(role==="fleet_manager")return true;if(role==="supervisor")return feature!=="user_management";return!["analytics","supervisor_override","user_management","export"].includes(feature);};
const BRANCHES     = ["MGCAVITE","MGQUEZON CITY","MGPAMPANGA","MGDAVAO","MGPALAWAN"];
const CLIENTS      = ["National Museum of the Philippines","China Banking Corporation","Purefoods — San Miguel Corporation","[Walk-in / Other]"];
const ASSESS_TYPES = ["Initial","Periodic","Re-Assessment","Pre-Dispatch"];
const APP_VERSION  = "1.5.1";

async function logError(context, error, extraData={}) {
  try {
    const entry = { id:Date.now(), timestamp:new Date().toISOString(), context, message:error?.message||String(error), stack:error?.stack||null, extra:extraData, appVersion:APP_VERSION, userAgent:navigator?.userAgent||"unknown" };
    let logs = [];
    try { const raw=localStorage.getItem("fms:errors"); if(raw) logs=JSON.parse(raw); } catch(_) {}
    logs = [entry,...logs].slice(0,100);
    localStorage.setItem("fms:errors", JSON.stringify(logs));
  } catch(_) {}
}
async function clearErrorLogs() { try { localStorage.setItem("fms:errors", JSON.stringify([])); } catch(_) {} }
async function loadErrorLogs() { try { const raw=localStorage.getItem("fms:errors"); return raw?JSON.parse(raw):[]; } catch(_) { return []; } }
function formatErrorForChat(log) {
  return ["--- MG FMS ERROR LOG ---",`Time:    ${log.timestamp}`,`Context: ${log.context}`,`Message: ${log.message}`,log.extra&&Object.keys(log.extra).length>0?`Extra:   ${JSON.stringify(log.extra)}`:null,log.stack?`Stack:   ${log.stack.split("\n").slice(0,4).join(" | ")}`:null,`Version: ${log.appVersion}`,"------------------------"].filter(Boolean).join("\n");
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state={hasError:false,error:null,copied:false}; }
  static getDerivedStateFromError(error) { return {hasError:true,error}; }
  componentDidCatch(error,info) { logError("ReactRenderCrash",error,{componentStack:info?.componentStack?.slice(0,300)}); }
  render() {
    if(!this.state.hasError) return this.props.children;
    const errText=["--- MG FMS CRASH REPORT ---",`Time:    ${new Date().toISOString()}`,`Message: ${this.state.error?.message||"Unknown error"}`,`Stack:   ${(this.state.error?.stack||"").split("\n").slice(0,4).join(" | ")}`,`Version: ${APP_VERSION}`].join("\n");
    return(<div className="min-h-screen bg-gray-50 flex items-center justify-center px-5"><div className="bg-white rounded-2xl border-2 border-red-200 p-6 max-w-sm w-full"><div className="text-3xl mb-3 text-center">⚠️</div><div className="font-black text-gray-900 text-lg text-center mb-1">Something went wrong</div><div className="text-gray-500 text-sm text-center mb-5">The error has been saved. Copy the details below and send to your app administrator.</div><div className="bg-gray-100 rounded-xl p-3 mb-4 overflow-auto max-h-36"><pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{errText}</pre></div><button onClick={async()=>{try{await navigator.clipboard.writeText(errText);}catch(_){alert(errText);}this.setState({copied:true});}} className="w-full bg-gray-800 text-white rounded-xl py-3 font-bold text-sm mb-3 active:scale-95">{this.state.copied?"✓ Copied!":"📋 Copy Error Details"}</button><button onClick={()=>{this.setState({hasError:false,error:null});window.location.reload();}} className="w-full bg-red-700 text-white rounded-xl py-3 font-bold text-sm active:scale-95">🔄 Reload App</button></div></div>);
  }
}

// PMS ITEMS — v1.1 adds Brake Cleaning
const PMS_ITEMS = [
  { code:"PMS_OIL",         label:"Engine Oil",                                icon:"🛢️",  kmInterval:10000, monthInterval:6,  note:"Replace engine oil every service. Check viscosity grade per manufacturer spec.", category:"scheduled" },
  { code:"PMS_OIL_FILTER", label:"Oil Filter",                                icon:"🔧",  kmInterval:10000, monthInterval:6,  note:"Replace oil filter every service. Inspect for leaks and proper seating after installation.", category:"scheduled" },
  { code:"PMS_AIR",         label:"Air Filter",                                icon:"💨",  kmInterval:10000, monthInterval:6,  note:"Clean or replace depending on condition and environment", category:"scheduled" },
  { code:"PMS_CABIN",       label:"Cabin Filter",                              icon:"🌬️",  kmInterval:15000, monthInterval:12, note:"Replace cabin air filter — check for dust, odor, and airflow restriction", category:"scheduled" },
  { code:"PMS_FUEL",        label:"Fuel Filter",                               icon:"⛽",  kmInterval:10000, monthInterval:6,  note:"Replace if clogged or dirty — check fuel pressure", category:"scheduled" },
  { code:"PMS_BRAKE_CLEAN", label:"Brake Cleaning",                            icon:"🧹",  kmInterval:10000, monthInterval:6,  note:"Clean brake dust, debris, and caliper slides on all four wheels — improves braking performance and longevity", category:"scheduled" },
  { code:"PMS_BRAKE_PAD_F", label:"Brake Pads Front",                            icon:"🛑",  kmInterval:40000, monthInterval:24, note:"Replace front brake pads — check thickness, wear pattern, and rotor contact surface", category:"brake" },
  { code:"PMS_BRAKE_PAD_R", label:"Brake Pads Rear",                             icon:"🛑",  kmInterval:40000, monthInterval:24, note:"Replace rear brake pads — check thickness, wear pattern, and rotor contact surface", category:"brake" },
  { code:"PMS_BRAKE_SHOE",  label:"Brake Shoes",                                 icon:"🛑",  kmInterval:40000, monthInterval:24, note:"Replace brake shoes — check lining thickness and drum contact surface", category:"brake" },
  { code:"PMS_BRAKE_ROTOR_F",label:"Brake Rotor Front",                          icon:"🔘",  kmInterval:60000, monthInterval:36, note:"Replace front brake rotors — check for scoring, warping, and minimum thickness", category:"brake" },
  { code:"PMS_BRAKE_ROTOR_R",label:"Brake Rotor Rear",                           icon:"🔘",  kmInterval:60000, monthInterval:36, note:"Replace rear brake rotors — check for scoring, warping, and minimum thickness", category:"brake" },
  { code:"PMS_BRAKE_DRUM",  label:"Brake Drum",                                  icon:"🔘",  kmInterval:60000, monthInterval:36, note:"Replace brake drums — check for scoring, ovality, and maximum diameter", category:"brake" },
  { code:"PMS_BRAKE_FLUID", label:"Brake Fluid",                                 icon:"🛑",  kmInterval:40000, monthInterval:12, note:"Replace brake fluid if contaminated or below MIN mark — flush and bleed all four corners", category:"brake" },
  { code:"PMS_BRAKE_CAL",   label:"Brake Caliper",                               icon:"🔧",  kmInterval:null,  monthInterval:60, note:"Inspect or replace brake calipers — check for seizure, leaks, and slide pin condition", category:"brake" },
  { code:"PMS_BRAKE_HOSE",  label:"Brake Hose",                                  icon:"🔧",  kmInterval:null,  monthInterval:36, note:"Replace brake hoses — check for cracking, bulging, leaks, and deterioration", category:"brake" },
  { code:"PMS_BRAKE_REFACE",label:"Reface Rotor Disc",                              icon:"🔘",  kmInterval:null,  monthInterval:null, note:"Resurface brake rotor disc — check for scoring, warping, and minimum thickness before refacing", category:"brake" },
  { code:"PMS_SPARK",       label:"Spark Plugs",                               icon:"⚡",  kmInterval:50000, monthInterval:48, note:"Check gap and electrode condition — petrol engines only", category:"scheduled" },
  { code:"PMS_COOL",        label:"Coolant / Radiator Flush",                  icon:"🌡️",  kmInterval:50000, monthInterval:48, note:"Flush and replace with correct coolant mix and ratio", category:"scheduled" },
  { code:"PMS_TRANS",       label:"Transmission Fluid",                        icon:"⚙️",  kmInterval:70000, monthInterval:48, note:"ATF or MTF per manufacturer spec", category:"scheduled" },
  { code:"PMS_DRIVEBELT",   label:"Drivebelt",                                 icon:"🔗",  kmInterval:80000, monthInterval:60, note:"Inspect for wear, cracking, tension, and alignment — replace if worn or noisy", category:"scheduled" },
  { code:"PMS_DIFF",        label:"Differential Oil",                          icon:"⚙️",  kmInterval:40000, monthInterval:12, note:"Front and rear differential — check for leaks and correct fluid level", category:"scheduled" },
  { code:"PMS_BATT",        label:"Battery & Terminals",                       icon:"🔋",  kmInterval:null,  monthInterval:24, note:"Check voltage, clean terminals, check electrolyte level — replace every 2 years", category:"scheduled" },
  { code:"PMS_TIMING",  label:"Timing Belt / Chain",                            icon:"⛓️",  kmInterval:100000,monthInterval:60, note:"Critical — inspect and replace timing belt or chain, tensioner, and idler pulleys", category:"major" },
  { code:"PMS_EGR",    label:"EGR / Intake Manifold & Throttle Body Cleaning", icon:"🔧", kmInterval:50000, monthInterval:36, note:"Diesel engines — removes carbon buildup from EGR valve, intake manifold, and throttle body", category:"major" },
  { code:"PMS_INTAKE", label:"Intake Manifold & Throttle Body Cleaning",       icon:"🌬️",  kmInterval:50000, monthInterval:36, note:"Petrol engines — cleans carbon deposits for improved air-fuel mixture and idle quality", category:"major" },
  { code:"PMS_TURBO",  label:"Turbo Cleaning",                                 icon:"🌀",  kmInterval:100000,monthInterval:60, note:"Inspect and clean turbocharger — check actuator, wastegate, and boost pressure", category:"major" },
  { code:"PMS_ATF",    label:"ATF Dialysis",                                   icon:"🔄",  kmInterval:70000, monthInterval:48, note:"Automatic transmission fluid dialysis — full fluid exchange and system flush", category:"major" },
  { code:"PMS_ECU",    label:"ECU Scanning",            icon:"💻",  kmInterval:null, monthInterval:null, note:"OBD-II diagnostic scan — records all active and stored DTCs, freeze frame data, and system readiness monitors.", category:"troubleshooting" },
  { code:"PMS_SENSOR", label:"Sensor Cleaning",         icon:"📡",  kmInterval:null, monthInterval:null, note:"Clean faulty or dirty sensors — MAF, O2, throttle position, crankshaft, camshaft.", category:"troubleshooting" },
  { code:"PMS_PARTS",  label:"Replace Parts",           icon:"🔩",  kmInterval:null, monthInterval:null, note:"Replacement of defective or worn parts identified during diagnosis or inspection.", category:"troubleshooting" },
  { code:"PMS_REWIRE", label:"Rewire",                  icon:"🔌",  kmInterval:null, monthInterval:null, note:"Electrical rewiring — damaged harness, corroded connectors, short circuits, or faulty wiring.", category:"troubleshooting" },
  { code:"PMS_REPROG", label:"Reprogram",               icon:"🖥️",  kmInterval:null, monthInterval:null, note:"ECU / module reprogramming — software update, parameter reset, or immobiliser programming.", category:"troubleshooting" },
  { code:"PMS_OTHER_T",label:"Other (Troubleshooting)", icon:"🔎",  kmInterval:null, monthInterval:null, note:"Any other diagnostic or troubleshooting procedure performed during the visit.", category:"troubleshooting" },
];

const LABOR_TYPES=[
  {code:"LBR_PMS",label:"Preventive Maintenance Service",icon:"🗓"},
  {code:"LBR_DIAG",label:"Diagnostic / ECU Scanning",icon:"💻"},
  {code:"LBR_TROUBLESHOOT",label:"Troubleshooting",icon:"🔍"},
  {code:"LBR_ENGINE",label:"Engine Repair",icon:"⚙️"},
  {code:"LBR_BRAKE",label:"Brake Service",icon:"🛑"},
  {code:"LBR_SUSPENSION",label:"Suspension & Steering Repair",icon:"🔧"},
  {code:"LBR_ELECTRICAL",label:"Electrical Repair",icon:"⚡"},
  {code:"LBR_TIRE",label:"Tire Service / Replacement",icon:"🔘"},
  {code:"LBR_BODY",label:"Body & Chassis Repair",icon:"🚗"},
  {code:"LBR_OIL",label:"Oil Change / Fluid Service",icon:"🛢️"},
  {code:"LBR_FILTER",label:"Filter Replacement",icon:"💨"},
  {code:"LBR_BELT",label:"Belt / Hose Replacement",icon:"🔗"},
  {code:"LBR_AC",label:"Air Conditioning Service",icon:"❄️"},
  {code:"LBR_ALIGN",label:"Wheel Alignment / Balancing",icon:"⚖️"},
  {code:"LBR_REWIRE",label:"Rewiring / Harness Repair",icon:"🔌"},
  {code:"LBR_REPROG",label:"Reprogramming / ECU Update",icon:"🖥️"},
  {code:"LBR_OTHER",label:"Other",icon:"📝"},
];

// Map inspection item codes → PMS item codes for auto-linking replacements
const INSP_TO_PMS={ENG_OIL:"PMS_OIL",ENG_OIL_FILTER:"PMS_OIL_FILTER",ENG_AIR:"PMS_AIR",ENG_CABIN:"PMS_CABIN",ENG_SPARK:"PMS_SPARK",ENG_FUEL:"PMS_FUEL",ENG_BELT:"PMS_DRIVEBELT",ENG_COOL:"PMS_COOL",ENG_TRANS:"PMS_TRANS",BRK_PAD_F:"PMS_BRAKE_PAD_F",BRK_PAD_R:"PMS_BRAKE_PAD_R",BRK_DRUM:"PMS_BRAKE_DRUM",BRK_SHOE:"PMS_BRAKE_SHOE",BRK_FLUID:"PMS_BRAKE_FLUID",BRK_HAND:"PMS_BRAKE_SHOE",ELC_BATT:"PMS_BATT",ELC_BATT_V:"PMS_BATT"};

function calcNextDue(lastOdo,lastDate,kmInterval,monthInterval){const nextOdo=kmInterval?parseInt(lastOdo)+kmInterval:null;let nextDate=null;if(monthInterval){const base=new Date(lastDate);base.setMonth(base.getMonth()+monthInterval);nextDate=base.toISOString().slice(0,10);}return{nextOdo,nextDate};}
function daysUntilDue(nextDate){return Math.ceil((new Date(nextDate)-new Date())/86400000);}
function kmUntilDue(nextOdo,currentOdo){return parseInt(nextOdo)-parseInt(currentOdo);}
function pmsUrgency(daysLeft,kmLeft){if(daysLeft<0||kmLeft<0)return{color:"text-red-700",bg:"bg-red-100",label:"Overdue"};if(daysLeft<=7||kmLeft<=500)return{color:"text-red-700",bg:"bg-red-50",label:"Due Soon"};if(daysLeft<=30||kmLeft<=1500)return{color:"text-amber-700",bg:"bg-amber-50",label:"Upcoming"};return{color:"text-green-700",bg:"bg-green-50",label:"On Track"};}
function buildVehicleRegistry(assessments,saved={}){const reg={...saved};[...assessments].sort((a,b)=>new Date(a.submittedAt)-new Date(b.submittedAt)).forEach(a=>{const p=a.header.plate;if(!reg[p])reg[p]={};reg[p]={...reg[p],make:a.header.make||reg[p].make||"",model:a.header.model||reg[p].model||"",yearModel:a.header.yearModel||reg[p].yearModel||"",client:a.header.client||reg[p].client||"",lastOdo:Math.max(parseInt(a.header.odometer)||0,reg[p].lastOdo||0)};});return reg;}

const DEMO_PMS_RECORDS={"UFF 4915":{PMS_OIL:{lastDate:"2026-03-20",lastOdo:165306,nextOdo:170306,nextDate:"2026-06-20",performedBy:"Amelia Castillo",branch:"MGCAVITE",rwaNumber:"RWA-2026-000143"},PMS_AIR:{lastDate:"2026-03-20",lastOdo:165306,nextOdo:175306,nextDate:"2026-09-20",performedBy:"Amelia Castillo",branch:"MGCAVITE",rwaNumber:"RWA-2026-000143"},PMS_BATT:{lastDate:"2026-01-15",lastOdo:158000,nextOdo:168000,nextDate:"2026-07-15",performedBy:"Amelia Castillo",branch:"MGCAVITE",rwaNumber:"RWA-2026-000130"},PMS_BRAKE:{lastDate:"2025-09-10",lastOdo:145000,nextOdo:165000,nextDate:"2026-09-10",performedBy:"Amelia Castillo",branch:"MGCAVITE",rwaNumber:"RWA-2025-000098"},PMS_TIMING:{lastDate:"2024-06-01",lastOdo:105000,nextOdo:165000,nextDate:"2027-06-01",performedBy:"Amelia Castillo",branch:"MGCAVITE",rwaNumber:"RWA-2024-000045"}},"SPK 5872":{PMS_OIL:{lastDate:"2026-01-10",lastOdo:28000,nextOdo:33000,nextDate:"2026-04-10",performedBy:"Amelia Castillo",branch:"MGCAVITE",rwaNumber:"RWA-2026-000110"},PMS_AIR:{lastDate:"2025-10-05",lastOdo:23000,nextOdo:33000,nextDate:"2026-04-05",performedBy:"Amelia Castillo",branch:"MGCAVITE",rwaNumber:"RWA-2025-000088"}},"ZOQ 3492":{PMS_OIL:{lastDate:"2026-03-23",lastOdo:94517,nextOdo:99517,nextDate:"2026-06-23",performedBy:"Marco Reyes",branch:"MGQUEZON CITY",rwaNumber:"RWA-2026-000145"},PMS_AIR:{lastDate:"2025-12-01",lastOdo:84000,nextOdo:94000,nextDate:"2026-06-01",performedBy:"Marco Reyes",branch:"MGQUEZON CITY",rwaNumber:"RWA-2025-000120"},PMS_SPARK:{lastDate:"2025-08-15",lastOdo:74000,nextOdo:94000,nextDate:"2026-08-15",performedBy:"Marco Reyes",branch:"MGQUEZON CITY",rwaNumber:"RWA-2025-000072"},PMS_TIMING:{lastDate:"2023-03-01",lastOdo:34000,nextOdo:94000,nextDate:"2026-03-01",performedBy:"Marco Reyes",branch:"MGQUEZON CITY",rwaNumber:"RWA-2023-000015"}}};

const DEMO_ASSESSMENTS=[{id:1000001,rwaNumber:"RWA-2026-000143",header:{plate:"UFF 4915",client:"Purefoods — San Miguel Corporation",branch:"MGCAVITE",technician:"Amelia Castillo",type:"Periodic",odometer:"165306",date:"2026-03-20"},itemResults:{ENG_OIL:{resultCode:"pass"},ENG_OIL_FILTER:{resultCode:"pass"},ENG_COOL:{resultCode:"pass"},ENG_MOUNT:{resultCode:"pass"},ENG_TRANS:{resultCode:"pass"},ENG_BELT:{resultCode:"pass"},ENG_AIR:{resultCode:"replaced",defectCode:"CONTAMINATED",partReplaced:"Air Filter",partQty:1},ENG_FUEL:{resultCode:"pass"},BRK_PAD_F:{resultCode:"replaced",measuredValue:"2.4",afterMeasure:"6.2",defectCode:"LOW_THICKNESS",partReplaced:"Brake Pad Set (Front)",partQty:1},BRK_PAD_R:{resultCode:"pass",measuredValue:"4.2"},BRK_ROTOR:{resultCode:"pass"},BRK_FLUID:{resultCode:"pass"},BRK_HAND:{resultCode:"pass"},BRK_ABS:{resultCode:"na"},SUS_SHOCK:{resultCode:"pass"},SUS_TIE:{resultCode:"pass"},SUS_PS:{resultCode:"pass"},SUS_ALIGN:{resultCode:"monitor",defectCode:"LOOSE",note:"Slight pull to the left — recommend wheel alignment"},ELC_BATT_V:{resultCode:"pass",measuredValue:"12.6"},ELC_BATT:{resultCode:"pass"},ELC_LIGHTS:{resultCode:"pass"},ELC_WIPER:{resultCode:"pass"},ELC_HORN:{resultCode:"pass"},ELC_DASH:{resultCode:"pass"},TIR_TREAD_F:{resultCode:"pass",measuredValue:"3.2"},TIR_TREAD_R:{resultCode:"pass",measuredValue:"3.8"},TIR_PSI:{resultCode:"pass"},TIR_SIDE:{resultCode:"pass"},TIR_SPARE:{resultCode:"pass"},TIR_NUTS:{resultCode:"pass"},BOD_STRUCT:{resultCode:"pass"},BOD_UNDER:{resultCode:"pass"},BOD_DOOR:{resultCode:"pass"},BOD_BELT:{resultCode:"pass"},BOD_WIND:{resultCode:"pass"},LTO_REG:{resultCode:"pass"},LTO_ORCR:{resultCode:"pass"},LTO_EMIS:{resultCode:"pass"},LTO_MVIS:{resultCode:"pass"},LTO_INS:{resultCode:"pass"}},classification:{overallStatus:"conditional",technicalStatus:"conditional",complianceStatus:"compliant",dispatchAllowed:true,dispatchBlockers:[],failCriticalCount:0,monitorCount:1,replacedCount:2,reassessmentRequired:true,reassessmentDue:"2026-04-19",totalBlockerCount:0},submittedAt:"2026-03-20T10:32:00.000Z"},{id:1000002,rwaNumber:"RWA-2026-000144",header:{plate:"SPK 5872",client:"Purefoods — San Miguel Corporation",branch:"MGCAVITE",technician:"Amelia Castillo",type:"Periodic",odometer:"33466",date:"2026-03-22"},itemResults:{ENG_OIL:{resultCode:"pass"},ENG_OIL_FILTER:{resultCode:"pass"},ENG_COOL:{resultCode:"pass"},ENG_MOUNT:{resultCode:"pass"},ENG_TRANS:{resultCode:"pass"},ENG_BELT:{resultCode:"pass"},ENG_AIR:{resultCode:"pass"},ENG_FUEL:{resultCode:"pass"},BRK_PAD_F:{resultCode:"fail_critical",measuredValue:"1.8",defectCode:"LOW_THICKNESS",note:"Critical — replacement required immediately"},BRK_PAD_R:{resultCode:"fail_critical",measuredValue:"1.6",defectCode:"LOW_THICKNESS"},BRK_ROTOR:{resultCode:"monitor",defectCode:"WORN"},BRK_FLUID:{resultCode:"pass"},BRK_HAND:{resultCode:"pass"},BRK_ABS:{resultCode:"pass"},SUS_SHOCK:{resultCode:"pass"},SUS_TIE:{resultCode:"pass"},SUS_PS:{resultCode:"pass"},SUS_ALIGN:{resultCode:"pass"},ELC_BATT_V:{resultCode:"monitor",measuredValue:"11.8",defectCode:"LOW_VOLTAGE"},ELC_BATT:{resultCode:"pass"},ELC_LIGHTS:{resultCode:"pass"},ELC_WIPER:{resultCode:"pass"},ELC_HORN:{resultCode:"pass"},ELC_DASH:{resultCode:"pass"},TIR_TREAD_F:{resultCode:"pass",measuredValue:"4.1"},TIR_TREAD_R:{resultCode:"pass",measuredValue:"3.9"},TIR_PSI:{resultCode:"pass"},TIR_SIDE:{resultCode:"pass"},TIR_SPARE:{resultCode:"pass"},TIR_NUTS:{resultCode:"pass"},BOD_STRUCT:{resultCode:"pass"},BOD_UNDER:{resultCode:"monitor",defectCode:"CORROSION",note:"Surface rust under chassis — monitor"},BOD_DOOR:{resultCode:"pass"},BOD_BELT:{resultCode:"pass"},BOD_WIND:{resultCode:"pass"},LTO_REG:{resultCode:"pass"},LTO_ORCR:{resultCode:"pass"},LTO_EMIS:{resultCode:"pass"},LTO_MVIS:{resultCode:"pass"},LTO_INS:{resultCode:"pass"}},classification:{overallStatus:"deferred",technicalStatus:"deferred",complianceStatus:"compliant",dispatchAllowed:false,dispatchBlockers:["BRK_PAD_F","BRK_PAD_R"],failCriticalCount:2,monitorCount:3,replacedCount:0,reassessmentRequired:true,reassessmentDue:"2026-03-25",totalBlockerCount:2},submittedAt:"2026-03-22T09:15:00.000Z"},{id:1000003,rwaNumber:"RWA-2026-000145",header:{plate:"ZOQ 3492",client:"National Museum of the Philippines",branch:"MGQUEZON CITY",technician:"Marco Reyes",type:"Initial",odometer:"94517",date:"2026-03-23"},itemResults:{ENG_OIL:{resultCode:"pass"},ENG_OIL_FILTER:{resultCode:"pass"},ENG_COOL:{resultCode:"pass"},ENG_MOUNT:{resultCode:"pass"},ENG_TRANS:{resultCode:"pass"},ENG_BELT:{resultCode:"pass"},ENG_AIR:{resultCode:"pass"},ENG_FUEL:{resultCode:"pass"},BRK_PAD_F:{resultCode:"pass",measuredValue:"5.8"},BRK_PAD_R:{resultCode:"pass",measuredValue:"5.2"},BRK_ROTOR:{resultCode:"pass"},BRK_FLUID:{resultCode:"pass"},BRK_HAND:{resultCode:"pass"},BRK_ABS:{resultCode:"na"},SUS_SHOCK:{resultCode:"pass"},SUS_TIE:{resultCode:"pass"},SUS_PS:{resultCode:"pass"},SUS_ALIGN:{resultCode:"pass"},ELC_BATT_V:{resultCode:"pass",measuredValue:"12.8"},ELC_BATT:{resultCode:"pass"},ELC_LIGHTS:{resultCode:"pass"},ELC_WIPER:{resultCode:"pass"},ELC_HORN:{resultCode:"pass"},ELC_DASH:{resultCode:"pass"},TIR_TREAD_F:{resultCode:"pass",measuredValue:"5.6"},TIR_TREAD_R:{resultCode:"pass",measuredValue:"5.4"},TIR_PSI:{resultCode:"pass"},TIR_SIDE:{resultCode:"pass"},TIR_SPARE:{resultCode:"pass"},TIR_NUTS:{resultCode:"pass"},BOD_STRUCT:{resultCode:"pass"},BOD_UNDER:{resultCode:"pass"},BOD_DOOR:{resultCode:"pass"},BOD_BELT:{resultCode:"pass"},BOD_WIND:{resultCode:"pass"},LTO_REG:{resultCode:"pass"},LTO_ORCR:{resultCode:"pass"},LTO_EMIS:{resultCode:"pass"},LTO_MVIS:{resultCode:"pass"},LTO_INS:{resultCode:"pass"}},classification:{overallStatus:"active",technicalStatus:"active",complianceStatus:"compliant",dispatchAllowed:true,dispatchBlockers:[],failCriticalCount:0,monitorCount:0,replacedCount:0,reassessmentRequired:false,reassessmentDue:null,totalBlockerCount:0},submittedAt:"2026-03-23T14:22:00.000Z"}];

const DEFECT_CODES={LOW_THICKNESS:"Low thickness",UNEVEN_WEAR:"Uneven wear",CONTAMINATED:"Contaminated",CRACKED:"Cracked",BULGE_PRESENT:"Bulge present",SIDEWALL_CRACK:"Sidewall crack",UNDERINFLATED:"Underinflated",LOW_TREAD:"Low tread depth",LOW_VOLTAGE:"Low voltage",CORROSION:"Corrosion / terminal buildup",LEAKING:"Leaking",WORN:"Worn beyond limit",DAMAGED:"Physically damaged",MISSING:"Missing / not found",EXPIRED:"Expired",NOT_FUNCTIONING:"Not functioning",NOISY:"Noise / vibration",LOOSE:"Loose / needs tightening",CLOGGED:"Clogged fuel filter",LOW_LEVEL:"Coolant level low",SCORED:"Scored / grooved",WARPED:"Warped",WORN_VALVE_GASKET:"Worn valve gasket",OTHER:"Other (see note)"};
const ACTION_CFG={NONE:{label:"No Action",color:"text-green-700",bg:"bg-green-50"},MONITOR_ONLY:{label:"Monitor",color:"text-amber-700",bg:"bg-amber-50"},REPAIR_REQUIRED:{label:"Repair Required",color:"text-orange-700",bg:"bg-orange-50"},REPAIR_IMMEDIATE:{label:"Repair Immediately",color:"text-red-700",bg:"bg-red-50"},HOLD_UNIT:{label:"⛔ Hold Unit",color:"text-red-900",bg:"bg-red-100"}};
function getAction(item,resultCode){if(!resultCode||resultCode==="pass"||resultCode==="na")return"NONE";if(resultCode==="replaced")return"NONE";if(resultCode==="monitor")return"MONITOR_ONLY";if(resultCode==="fail_critical"){if(item.isCompliance)return"REPAIR_REQUIRED";if(item.holdUnit)return"HOLD_UNIT";if(item.isCritical)return"REPAIR_IMMEDIATE";return"REPAIR_REQUIRED";}return"NONE";}

// CATEGORIES — v1.1: ENG_OIL_FILTER added as separate inspection item
const CATEGORIES=[
  {code:"ENG",label:"Engine & Drivetrain",icon:"⚙️",items:[
    {code:"ENG_OIL",       label:"Engine oil — condition & level",         type:"condition",isCritical:false,defects:["CONTAMINATED","LEAKING","LOW_THICKNESS"]},
    {code:"ENG_OIL_FILTER",label:"Oil filter — condition & replace",       type:"condition",isCritical:false,defects:["CONTAMINATED","DAMAGED","OTHER"]},
    {code:"ENG_COOL",      label:"Coolant level & condition",              type:"condition",isCritical:false,defects:["LEAKING","CONTAMINATED","LOW_LEVEL"]},
    {code:"ENG_MOUNT",     label:"Engine mounts — no excessive vibration", type:"condition",isCritical:false,defects:["LOOSE","WORN","DAMAGED"]},
    {code:"ENG_TRANS",     label:"Transmission fluid level",               type:"condition",isCritical:false,defects:["LEAKING","LOW_THICKNESS"]},
    {code:"ENG_BELT",      label:"Drive belts condition",                  type:"condition",isCritical:false,defects:["CRACKED","WORN","OTHER"]},
    {code:"ENG_AIR",       label:"Air filter condition",                   type:"condition",isCritical:false,defects:["CONTAMINATED","DAMAGED"]},
    {code:"ENG_CABIN",     label:"Cabin filter condition",                 type:"condition",isCritical:false,defects:["CONTAMINATED","DAMAGED","CLOGGED"]},
    {code:"ENG_SPARK",     label:"Spark plugs condition",                  type:"condition",isCritical:false,defects:["WORN","CONTAMINATED","DAMAGED","OTHER"]},
    {code:"ENG_FUEL",      label:"Fuel system — no visible leaks",         type:"condition",isCritical:true,holdUnit:true,defects:["LEAKING","CLOGGED","OTHER"]},
    {code:"ENG_VALVE_GSKT",label:"Valve gasket condition",                   type:"condition",isCritical:false,defects:["WORN_VALVE_GASKET","LEAKING","OTHER"]},
  ]},
  {code:"BRK",label:"Braking System",icon:"🛑",items:[
    {code:"BRK_PAD_F",label:"Brake pad thickness — front",type:"measurable",isCritical:true,holdUnit:true,unit:"mm",threshold:3.0,thresholdLabel:"Min 3.0mm",defects:["LOW_THICKNESS","UNEVEN_WEAR","CONTAMINATED","CRACKED"]},
    {code:"BRK_PAD_R",label:"Brake pad thickness — rear", type:"measurable",isCritical:true,holdUnit:true,unit:"mm",threshold:3.0,thresholdLabel:"Min 3.0mm",defects:["LOW_THICKNESS","UNEVEN_WEAR","CONTAMINATED","CRACKED"]},
    {code:"BRK_ROTOR",label:"Brake rotors / drums",       type:"condition",isCritical:false,defects:["WORN","CRACKED","SCORED","WARPED","OTHER"]},
    {code:"BRK_DRUM", label:"Brake drum condition",      type:"condition",isCritical:false,defects:["WORN","CRACKED","SCORED","OTHER"]},
    {code:"BRK_SHOE", label:"Brake shoe condition",      type:"condition",isCritical:true,holdUnit:true,defects:["LOW_THICKNESS","WORN","CONTAMINATED","CRACKED"]},
    {code:"BRK_FLUID",label:"Brake fluid level",          type:"condition",isCritical:false,defects:["LOW_THICKNESS","CONTAMINATED"]},
    {code:"BRK_HAND", label:"Handbrake effectiveness",    type:"condition",isCritical:true,holdUnit:true,defects:["NOT_FUNCTIONING","WORN"]},
    {code:"BRK_ABS",  label:"ABS warning light",          type:"condition",isCritical:false,defects:["NOT_FUNCTIONING","OTHER"]},
  ]},
  {code:"SUS",label:"Suspension & Steering",icon:"🔧",items:[
    {code:"SUS_SHOCK",label:"Shock absorbers — no leaks",     type:"condition",isCritical:false,defects:["LEAKING","WORN","DAMAGED"]},
    {code:"SUS_TIE",  label:"Tie rods and ball joints",       type:"condition",isCritical:true,holdUnit:true,defects:["WORN","LOOSE","DAMAGED"]},
    {code:"SUS_PS",   label:"Power steering fluid",           type:"condition",isCritical:false,defects:["LEAKING","LOW_THICKNESS"]},
    {code:"SUS_ALIGN",label:"Steering wheel play & alignment",type:"condition",isCritical:false,defects:["LOOSE","OTHER"]},
  ]},
  {code:"ELC",label:"Electrical System",icon:"⚡",items:[
    {code:"ELC_BATT_V",label:"Battery voltage",               type:"measurable",isCritical:false,unit:"V",threshold:12.0,thresholdLabel:"Min 12.0V",defects:["LOW_VOLTAGE","CORROSION"]},
    {code:"ELC_BATT",  label:"Battery condition & terminals", type:"condition",isCritical:false,defects:["CORROSION","DAMAGED","OTHER"]},
    {code:"ELC_LIGHTS",label:"All exterior lights functioning",type:"condition",isCritical:true,defects:["NOT_FUNCTIONING","DAMAGED"]},
    {code:"ELC_WIPER", label:"Wipers and washer system",      type:"condition",isCritical:false,defects:["NOT_FUNCTIONING","WORN"]},
    {code:"ELC_HORN",  label:"Horn functioning",              type:"condition",isCritical:false,defects:["NOT_FUNCTIONING","OTHER"]},
    {code:"ELC_DASH",  label:"Dashboard — no active warnings",type:"condition",isCritical:false,defects:["OTHER"]},
  ]},
  {code:"TIR",label:"Tires & Wheels",icon:"🔘",items:[
    {code:"TIR_TREAD_F",label:"Front tire tread depth",         type:"measurable",isCritical:true,holdUnit:true,unit:"mm",threshold:1.6,thresholdLabel:"Min 1.6mm",defects:["LOW_TREAD","UNEVEN_WEAR"]},
    {code:"TIR_TREAD_R",label:"Rear tire tread depth",          type:"measurable",isCritical:true,holdUnit:true,unit:"mm",threshold:1.6,thresholdLabel:"Min 1.6mm",defects:["LOW_TREAD","UNEVEN_WEAR"]},
    {code:"TIR_PSI",    label:"Tire inflation — all tires",     type:"condition",isCritical:false,defects:["UNDERINFLATED","OTHER"]},
    {code:"TIR_SIDE",   label:"Sidewall condition",             type:"condition",isCritical:true,holdUnit:true,defects:["SIDEWALL_CRACK","BULGE_PRESENT","DAMAGED"]},
    {code:"TIR_SPARE",  label:"Spare tire condition & pressure",type:"condition",isCritical:false,defects:["LOW_TREAD","UNDERINFLATED","MISSING"]},
    {code:"TIR_NUTS",   label:"Wheel nuts — properly torqued",  type:"condition",isCritical:true,holdUnit:true,defects:["LOOSE","MISSING"]},
  ]},
  {code:"BOD",label:"Body & Chassis",icon:"🚗",items:[
    {code:"BOD_STRUCT",label:"Structural integrity",              type:"condition",isCritical:true,holdUnit:true,defects:["DAMAGED","OTHER"]},
    {code:"BOD_UNDER", label:"Undercarriage — no major corrosion",type:"condition",isCritical:false,defects:["CORROSION","DAMAGED"]},
    {code:"BOD_DOOR",  label:"Door, window, lock operation",      type:"condition",isCritical:false,defects:["NOT_FUNCTIONING","DAMAGED"]},
    {code:"BOD_BELT",  label:"Seat belts — all functioning",      type:"condition",isCritical:true,holdUnit:true,defects:["NOT_FUNCTIONING","DAMAGED"]},
    {code:"BOD_WIND",  label:"Windshield — no obstructing cracks",type:"condition",isCritical:true,defects:["CRACKED","DAMAGED"]},
  ]},
  {code:"LTO",label:"LTO Compliance",icon:"📋",isCompliance:true,items:[
    {code:"LTO_REG",  label:"Registration — current & valid", type:"condition",isCritical:false,isCompliance:true,defects:["EXPIRED","MISSING"]},
    {code:"LTO_ORCR", label:"OR/CR on board",                 type:"condition",isCritical:false,isCompliance:true,defects:["MISSING","OTHER"]},
    {code:"LTO_EMIS", label:"Emission sticker — current",     type:"condition",isCritical:false,isCompliance:true,defects:["EXPIRED","MISSING"]},
    {code:"LTO_MVIS", label:"MVIS certificate — current",     type:"condition",isCritical:false,isCompliance:true,defects:["EXPIRED","MISSING"]},
    {code:"LTO_INS",  label:"Third-party insurance — current",type:"condition",isCritical:false,isCompliance:true,defects:["EXPIRED","MISSING"]},
  ]},
];

const ALL_ITEMS=CATEGORIES.flatMap(c=>c.items);
const ITEM_MAP=Object.fromEntries(ALL_ITEMS.map(i=>[i.code,i]));
const PRE_DISPATCH_ITEMS=new Set(ALL_ITEMS.filter(i=>i.holdUnit||i.isCritical||i.isCompliance).map(i=>i.code));
function getActiveItems(type,prevAssessment){if(type==="Re-Assessment"&&prevAssessment){const flagged=new Set();ALL_ITEMS.forEach(i=>{const r=prevAssessment.itemResults?.[i.code];if(r?.resultCode==="fail_critical"||r?.resultCode==="monitor")flagged.add(i.code);});return flagged;}if(type==="Pre-Dispatch")return PRE_DISPATCH_ITEMS;return null;}
function getActiveCategories(activeSet){if(!activeSet)return CATEGORIES;return CATEGORIES.map(c=>({...c,items:c.items.filter(i=>activeSet.has(i.code))})).filter(c=>c.items.length>0);}

function calcHealthScore(classification,itemResults){if(!classification||!itemResults)return 100;const answered=ALL_ITEMS.filter(i=>itemResults[i.code]?.resultCode&&itemResults[i.code].resultCode!=="na").length;if(answered===0)return 100;let deductions=0;ALL_ITEMS.forEach(item=>{const r=itemResults[item.code];if(!r?.resultCode)return;if(r.resultCode==="fail_critical"){deductions+=item.holdUnit?20:item.isCritical?15:item.isCompliance?10:8;}if(r.resultCode==="monitor")deductions+=item.isCritical?5:3;});return Math.max(0,Math.min(100,100-deductions));}
function healthColor(score){if(score>=80)return{text:"text-green-700",bg:"bg-green-100",bar:"bg-green-500"};if(score>=50)return{text:"text-amber-700",bg:"bg-amber-100",bar:"bg-amber-500"};return{text:"text-red-700",bg:"bg-red-100",bar:"bg-red-500"};}
function getRepeatDefects(vehicleAssessments){const counts={};vehicleAssessments.forEach(a=>{ALL_ITEMS.forEach(item=>{const r=a.itemResults?.[item.code];if(r?.resultCode==="fail_critical"||r?.resultCode==="monitor"){counts[item.code]=(counts[item.code]||0)+1;}});});return counts;}
function getMeasurableTrend(vehicleAssessments,itemCode){return vehicleAssessments.filter(a=>a.itemResults?.[itemCode]?.measuredValue!==undefined&&a.itemResults[itemCode].measuredValue!=="").map(a=>({date:a.header.date,value:parseFloat(a.itemResults[itemCode].measuredValue),rwa:a.rwaNumber})).reverse();}

function buildShareText(a){const cls=a.classification;const fails=ALL_ITEMS.filter(i=>a.itemResults[i.code]?.resultCode==="fail_critical");const mons=ALL_ITEMS.filter(i=>a.itemResults[i.code]?.resultCode==="monitor");const status=cls.overallStatus.toUpperCase();const dispatch=cls.dispatchAllowed?"CLEARED FOR DISPATCH ✓":"⛔ DO NOT DISPATCH — UNIT ON HOLD";let txt=`📋 MG FLEET ASSESSMENT RESULT\n━━━━━━━━━━━━━━━━━━━━\nRWA No.: ${a.rwaNumber}\nPlate:   ${a.header.plate}\n${a.header.make?`Vehicle: ${a.header.make} ${a.header.model||""}${a.header.yearModel?` (${a.header.yearModel})`:""}\n`:""}Client:  ${a.header.client}\nBranch:  ${a.header.branch}\nDate:    ${a.header.date}\nTech:    ${a.header.technician}\n━━━━━━━━━━━━━━━━━━━━\nSTATUS: ${status}\n${dispatch}\n`;if(cls.reassessmentDue)txt+=`Reassessment by: ${cls.reassessmentDue}\n`;if(fails.length>0){txt+=`━━━━━━━━━━━━━━━━━━━━\n🚨 CRITICAL (${fails.length}):\n`;fails.forEach(item=>{const r=a.itemResults[item.code];txt+=`  • ${item.label}`;if(r.measuredValue!==undefined&&r.measuredValue!=="")txt+=` [${r.measuredValue}${item.unit}]`;if(r.defectCode)txt+=` — ${DEFECT_CODES[r.defectCode]}`;txt+=`\n`;});}if(mons.length>0){txt+=`⚠️ MONITOR (${mons.length}):\n`;mons.forEach(item=>{txt+=`  • ${item.label}\n`;});}const reps=ALL_ITEMS.filter(i=>a.itemResults[i.code]?.resultCode==="replaced");if(reps.length>0){txt+=`🔩 REPLACED ON-SITE (${reps.length}):\n`;reps.forEach(item=>{const r=a.itemResults[item.code];txt+=`  • ${item.label}`;if(r.partReplaced)txt+=` — ${r.partQty&&r.partQty>1?r.partQty+"× ":""}${r.partReplaced}`;txt+=`\n`;});}txt+=`━━━━━━━━━━━━━━━━━━━━\nMG Fleet Management System (FMS)\nfleet.mastergarage.ph`;return txt;}

// RULE ENGINE v1.1 — replaced items = resolved, no reassessment needed for them
function runEngine(itemResults){let hasFail=false,hasMonitor=false,hasCompliance=false;let blockers=[],failCritCount=0,monCount=0,replacedCount=0;ALL_ITEMS.forEach(item=>{const r=itemResults[item.code];if(!r?.resultCode)return;if(r.resultCode==="fail_critical"){hasFail=true;failCritCount++;if(item.isCompliance)hasCompliance=true;if(item.isCritical||item.holdUnit)blockers.push(item.code);}if(r.resultCode==="monitor"){hasMonitor=true;monCount++;}if(r.resultCode==="replaced"){replacedCount++;}});const compliance=hasCompliance?"non_compliant":"compliant";let status,dispatch;if(hasFail){status="deferred";dispatch=false;}else if(hasMonitor){status="conditional";dispatch=true;}else{status="active";dispatch=true;}const now=new Date();let reassDue=null;if(status==="deferred"){const d=new Date(now);d.setDate(d.getDate()+3);reassDue=d.toISOString().slice(0,10);}else if(status==="conditional"){const d=new Date(now);d.setDate(d.getDate()+30);reassDue=d.toISOString().slice(0,10);}return{overallStatus:status,technicalStatus:status,complianceStatus:compliance,dispatchAllowed:dispatch,dispatchBlockers:blockers,failCriticalCount:failCritCount,monitorCount:monCount,replacedCount,reassessmentRequired:hasFail||hasMonitor,reassessmentDue:reassDue,totalBlockerCount:blockers.length};}

const RC={pass:{label:"Pass",bg:"bg-green-600",text:"text-white",light:"bg-green-50 text-green-700",icon:"✓"},monitor:{label:"Monitor",bg:"bg-amber-500",text:"text-white",light:"bg-amber-50 text-amber-700",icon:"⚠"},fail_critical:{label:"Fail Critical",bg:"bg-red-600",text:"text-white",light:"bg-red-50 text-red-700",icon:"✕"},replaced:{label:"Replaced",bg:"bg-blue-600",text:"text-white",light:"bg-blue-50 text-blue-700",icon:"🔩"},na:{label:"N/A",bg:"bg-gray-400",text:"text-white",light:"bg-gray-50 text-gray-500",icon:"—"}};
const SC={active:{label:"ACTIVE / Roadworthy",bg:"bg-green-600",badge:"bg-green-100 text-green-800",grad:"from-green-700 to-green-600"},conditional:{label:"CONDITIONAL",bg:"bg-amber-500",badge:"bg-amber-100 text-amber-800",grad:"from-amber-600 to-amber-500"},deferred:{label:"DEFERRED — Not Roadworthy",bg:"bg-red-700",badge:"bg-red-100 text-red-800",grad:"from-red-800 to-red-700"}};

const Badge=({label,color})=><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{label}</span>;
function TopBar({title,sub,onBack,right}){return(<div className="bg-red-700 text-white px-4 pt-12 pb-5"><div className="flex items-center gap-3">{onBack&&<button onClick={onBack} className="text-white/60 text-2xl leading-none">←</button>}<div className="flex-1 min-w-0"><div className="font-black text-lg truncate">{title}</div>{sub&&<div className="text-white/60 text-xs mt-0.5">{sub}</div>}</div>{right}</div></div>);}

function compressImage(file,maxDim=600,quality=0.5){return new Promise((resolve)=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>maxDim||h>maxDim){if(w>h){h=Math.round(h*(maxDim/w));w=maxDim;}else{w=Math.round(w*(maxDim/h));h=maxDim;}}const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);resolve(c.toDataURL("image/jpeg",quality));};img.src=URL.createObjectURL(file);});}
function b64size(b64){const len=b64.length-(b64.indexOf(",")+1);return Math.round(len*3/4/1024);}
function docByteSize(obj){try{return new Blob([JSON.stringify(obj)]).size;}catch(_){return JSON.stringify(obj).length;}}
function trimPhotosToFit(doc,maxBytes=900000){let d=JSON.parse(JSON.stringify(doc));if(docByteSize(d)<=maxBytes)return d;const strips=[d2=>{if(d2.pmsData?.ecuData?.photos)d2.pmsData.ecuData.photos=[];},d2=>{if(d2.pmsData?.serviceDetails)Object.values(d2.pmsData.serviceDetails).forEach(s=>{if(s.photos)s.photos=[];});},d2=>{if(d2.pmsData?.updates)Object.values(d2.pmsData.updates).forEach(u=>{if(u.photos)u.photos=[];});},d2=>{if(d2.pmsData?.ecuData?.codes)d2.pmsData.ecuData.codes.forEach(c=>{c.photo=null;});},d2=>{Object.values(d2.itemResults||{}).forEach(r=>{if(r.photos)r.photos=[];});if(d2.adjustedResults)Object.values(d2.adjustedResults).forEach(r=>{if(r.photos)r.photos=[];});}];for(const strip of strips){strip(d);if(docByteSize(d)<=maxBytes)return d;}return d;}

function PhotoLightbox({src,onClose}){if(!src)return null;return(<div onClick={onClose} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" style={{WebkitTapHighlightColor:"transparent"}}><button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full text-2xl font-bold flex items-center justify-center z-50">✕</button><img src={src} className="max-w-full max-h-full object-contain rounded-lg" alt="Full view"/><div className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-xs">{b64size(src)} KB · Tap anywhere to close</div></div>);}

function PhotoCapture({photos,onAdd,onRemove,maxPhotos=3}){const camRef=useRef();const galRef=useRef();const[viewSrc,setViewSrc]=useState(null);const handle=async(e)=>{const f=e.target.files[0];if(!f)return;const compressed=await compressImage(f);onAdd(compressed);e.target.value="";};const canAdd=(photos||[]).length<maxPhotos;return(<><div className="flex flex-wrap gap-2">{(photos||[]).map((src,i)=>(<div key={i} className="relative w-16 h-16"><img src={src} onClick={()=>setViewSrc(src)} className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 cursor-pointer" alt=""/><div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center rounded-b-xl pointer-events-none" style={{fontSize:"7px",padding:"1px 0",lineHeight:"1.2"}}>{b64size(src)} KB</div><button onClick={()=>onRemove(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow">✕</button></div>))}{canAdd&&(<><button type="button" onClick={()=>camRef.current.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors"><div className="text-lg">📷</div><div className="text-xs font-bold">Camera</div></button><button type="button" onClick={()=>galRef.current.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"><div className="text-lg">🖼️</div><div className="text-xs font-bold">Gallery</div></button></>)}<input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle}/><input ref={galRef} type="file" accept="image/*" className="hidden" onChange={handle}/></div><PhotoLightbox src={viewSrc} onClose={()=>setViewSrc(null)}/></>);}

function InspItem({item,value,onChange}){
  const v=value||{};
  const isReplaced=v.resultCode==="replaced";
  const isFailOrMonitor=v.resultCode==="fail_critical"||v.resultCode==="monitor";
  const showDefectBlock=isFailOrMonitor||isReplaced;
  const action=getAction(item,v.resultCode);
  const actCfg=ACTION_CFG[action];
  const setResult=(code)=>{const same=code===v.resultCode;const clear=same||code==="pass"||code==="na";onChange({...v,resultCode:same?null:code,defectCode:clear?null:v.defectCode,partReplaced:clear?null:v.partReplaced,partQty:clear?null:v.partQty,afterMeasure:clear?null:v.afterMeasure});};
  const setMeasure=(val)=>{const auto=val!==""?(parseFloat(val)<item.threshold?"fail_critical":"pass"):null;onChange({...v,measuredValue:val,resultCode:auto});};
  const addPhoto=(src)=>onChange({...v,photos:[...(v.photos||[]),src]});
  const delPhoto=(i)=>{const p=[...(v.photos||[])];p.splice(i,1);onChange({...v,photos:p});};
  const border=v.resultCode==="fail_critical"?"border-red-400 bg-red-50":v.resultCode==="monitor"?"border-amber-400 bg-amber-50":v.resultCode==="replaced"?"border-blue-400 bg-blue-50":v.resultCode==="pass"?"border-green-400 bg-green-50":v.resultCode==="na"?"border-gray-300 bg-gray-50":"border-gray-200 bg-white";
  return(
    <div className={`rounded-2xl border-2 mb-3 overflow-hidden transition-all ${border}`}>
      <div className="px-4 pt-3 pb-2.5">
        <div className="flex items-start gap-2 mb-2">
          <span className="font-semibold text-gray-800 text-sm leading-snug flex-1">{item.label}</span>
          <div className="flex gap-1 shrink-0">
            {item.holdUnit&&<span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-bold">HOLD</span>}
            {item.isCritical&&!item.holdUnit&&<span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-bold">CRIT</span>}
            {item.isCompliance&&<span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold">LTO</span>}
          </div>
        </div>
        {item.type==="measurable"&&(<div className="flex items-center gap-2 mb-2.5"><div className="flex flex-col items-center"><span className="text-xs text-gray-400 mb-0.5">Before</span><input type="number" step="0.01" placeholder="0.00" value={v.measuredValue??""} onChange={e=>setMeasure(e.target.value)} className="w-20 border-2 border-gray-200 focus:border-blue-500 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none"/></div><span className="text-sm text-gray-400 mt-4">{item.unit}</span><span className="text-xs text-gray-400 italic mt-4">{item.thresholdLabel}</span>{v.resultCode&&v.resultCode!=="replaced"&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-4 ${RC[v.resultCode]?.light}`}>{RC[v.resultCode]?.label}</span>}</div>)}
        <div className="grid grid-cols-5 gap-1.5">
          {["pass","monitor","fail_critical","replaced","na"].map(code=>(<button key={code} onClick={()=>setResult(code)} className={`py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${v.resultCode===code?`${RC[code].bg} ${RC[code].text} shadow-md`:"bg-gray-100 text-gray-400 hover:bg-gray-200"}`}><div className="text-base leading-none">{RC[code].icon}</div><div className="mt-0.5 leading-none text-xs" style={{fontSize:"10px"}}>{RC[code].label}</div></button>))}
        </div>
        {v.resultCode&&action!=="NONE"&&(<div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${actCfg.bg} ${actCfg.color}`}>{actCfg.label}</div>)}
        {isReplaced&&(<div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">🔩 Replaced on-site — resolved</div>)}
      </div>
      {showDefectBlock&&(
        <div className="px-4 pb-4 pt-2 border-t border-dashed border-gray-300 space-y-3">
          <div><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{isReplaced?"Defect Found (Before Replacement)":"Defect Type"}</div><div className="flex flex-wrap gap-1.5">{item.defects.map(dc=>(<button key={dc} onClick={()=>onChange({...v,defectCode:dc})} className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${v.defectCode===dc?"bg-red-600 text-white border-red-600":"bg-white text-gray-600 border-gray-300 hover:border-red-400"}`}>{DEFECT_CODES[dc]}</button>))}</div></div>
          {isReplaced&&(<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-3"><div className="text-xs font-black text-blue-700 uppercase tracking-wide">🔩 Replacement Details</div><div><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Part / Material Replaced *</div><input type="text" placeholder="e.g. Brake pad set (front), Engine oil filter..." value={v.partReplaced||""} onChange={e=>onChange({...v,partReplaced:e.target.value})} className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none bg-white"/></div><div className="flex items-center gap-3"><div className="flex-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Quantity</div><div className="flex items-center gap-2"><button onClick={()=>onChange({...v,partQty:Math.max(1,(v.partQty||1)-1)})} className="w-8 h-8 bg-white border-2 border-blue-200 rounded-lg font-black text-lg text-gray-600 flex items-center justify-center">−</button><span className="text-lg font-black text-gray-800 w-8 text-center">{v.partQty||1}</span><button onClick={()=>onChange({...v,partQty:(v.partQty||1)+1})} className="w-8 h-8 bg-white border-2 border-blue-200 rounded-lg font-black text-lg text-gray-600 flex items-center justify-center">+</button></div></div>{item.type==="measurable"&&(<div className="flex-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">After ({item.unit})</div><div className="flex items-center gap-1.5"><input type="number" step="0.01" placeholder="0.00" value={v.afterMeasure??""} onChange={e=>onChange({...v,afterMeasure:e.target.value})} className="w-24 border-2 border-blue-200 focus:border-blue-500 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none bg-white"/><span className="text-sm text-gray-400">{item.unit}</span>{v.afterMeasure&&parseFloat(v.afterMeasure)>=item.threshold&&<span className="text-xs font-bold text-green-600">✓ OK</span>}{v.afterMeasure&&parseFloat(v.afterMeasure)<item.threshold&&<span className="text-xs font-bold text-red-600">Still low</span>}</div></div>)}</div></div>)}
          <div><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{isReplaced?"Photos (Before / After)":"Photos (max 3)"}</div><PhotoCapture photos={v.photos} onAdd={addPhoto} onRemove={delPhoto}/></div>
          <div><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Note</div><input type="text" placeholder={isReplaced?"e.g. Replaced during inspection, parts from stock...":"Add note (optional)..."} value={v.note||""} onChange={e=>onChange({...v,note:e.target.value})} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/></div>
        </div>
      )}
    </div>
  );
}

function CatCard({cat,results,onChange,expanded,onToggle,onComplete}){
  const total=cat.items.length;const done=cat.items.filter(i=>results[i.code]?.resultCode).length;const fails=cat.items.filter(i=>results[i.code]?.resultCode==="fail_critical").length;const mons=cat.items.filter(i=>results[i.code]?.resultCode==="monitor").length;const replaced=cat.items.filter(i=>results[i.code]?.resultCode==="replaced").length;const pct=Math.round(done/total*100);const bar=fails>0?"bg-red-500":mons>0?"bg-amber-500":done===total?"bg-green-500":"bg-gray-300";const allDone=done===total;
  const quickPassAll=()=>{cat.items.forEach(item=>{if(!results[item.code]?.resultCode){onChange(item.code,{resultCode:"pass"});}});};
  return(<div className={`rounded-2xl shadow-sm border overflow-hidden mb-3 transition-all ${allDone&&fails===0&&mons===0?"border-green-200 bg-green-50/30":"bg-white border-gray-200"}`}><button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/5"><span className="text-xl">{allDone&&fails===0&&mons===0?"✅":cat.icon}</span><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><span className="font-bold text-gray-800 text-sm">{cat.label}</span><div className="flex items-center gap-1.5 shrink-0">{fails>0&&<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{fails}✕</span>}{mons>0&&<span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{mons}⚠</span>}{replaced>0&&<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{replaced}🔩</span>}<span className="text-xs text-gray-400">{done}/{total}</span><span className="text-gray-300">{expanded?"▲":"▼"}</span></div></div><div className="flex items-center gap-2 mt-1.5"><div className="flex-1 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full transition-all ${bar}`} style={{width:`${pct}%`}}/></div><span className="text-xs text-gray-400">{pct}%</span></div></div></button>{expanded&&(<div className="px-4 pb-4 border-t border-gray-100 pt-3">{cat.items.map(item=>(<InspItem key={item.code} item={item} value={results[item.code]} onChange={val=>onChange(item.code,val)}/>))}{done<total&&(<button onClick={quickPassAll} className="w-full mt-1 py-3 border-2 border-dashed border-green-400 text-green-700 rounded-xl font-bold text-sm hover:bg-green-50 active:scale-95 transition-all flex items-center justify-center gap-2"><span>✓</span> Mark all remaining as Pass ({total-done} items)</button>)}{allDone&&onComplete&&(<button onClick={onComplete} className="w-full mt-2 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm active:scale-95 flex items-center justify-center gap-2">Next Category →</button>)}</div>)}</div>);
}

function ACard({a,onClick,onPlateClick}){
  const cfg=SC[a.classification.overallStatus];const fails=a.classification.failCriticalCount||0;const days=a.classification.reassessmentDue?Math.ceil((new Date(a.classification.reassessmentDue)-new Date())/86400000):null;const score=calcHealthScore(a.classification,a.itemResults);const hc=healthColor(score);
  return(<button onClick={onClick} className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left shadow-sm hover:shadow-md transition-all active:scale-99"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><span className="font-black text-gray-900 text-lg">{a.header.plate}</span>{onPlateClick&&(<button onClick={e=>{e.stopPropagation();onPlateClick(a.header.plate);}} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold hover:bg-red-100 hover:text-red-700 transition-colors">Profile →</button>)}</div><div className="flex items-center gap-1.5"><span className={`text-xs font-black ${hc.text} ${hc.bg} px-2 py-0.5 rounded-full`}>{score}</span><Badge label={cfg.label} color={cfg.badge}/></div></div><div className="text-xs text-gray-400 font-mono">{a.rwaNumber}</div><div className="text-xs text-gray-400 mt-0.5">{a.header.client}</div><div className="text-xs text-gray-400">{a.header.branch} · {a.header.type} · {a.header.technician}</div><div className="flex items-center gap-2 mt-2 flex-wrap">{fails>0&&<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">🚨{fails} Critical</span>}{!a.classification.dispatchAllowed&&!a.resolvedByRwa&&<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">⛔ Hold</span>}{a.resolvedByRwa&&<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">✅ Resolved</span>}{a.classification.dispatchAllowed&&!a.resolvedByRwa&&<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">✓ Cleared</span>}{a.supervisorCleared&&<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">👤 Cleared</span>}{days!==null&&days<=7&&<span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">⏰{days}d</span>}<span className="text-xs text-gray-400 ml-auto">{new Date(a.submittedAt).toLocaleDateString("en-PH")}</span></div></button>);
}

// PMS SCREEN — v1.1: Service items have Part Name + Quantity + Photos for documentation
const SERVICE_TABS=[{key:"pms",label:"PMS",icon:"🗓",color:"bg-green-600",light:"bg-green-50",border:"border-green-500",text:"text-green-700"},{key:"brake",label:"Brake System",icon:"🛑",color:"bg-red-600",light:"bg-red-50",border:"border-red-500",text:"text-red-700"},{key:"major",label:"Major Services",icon:"⚙️",color:"bg-orange-500",light:"bg-orange-50",border:"border-orange-400",text:"text-orange-700"},{key:"troubleshooting",label:"Troubleshooting",icon:"🔍",color:"bg-blue-600",light:"bg-blue-50",border:"border-blue-500",text:"text-blue-700"},{key:"other",label:"Other",icon:"📝",color:"bg-gray-600",light:"bg-gray-50",border:"border-gray-400",text:"text-gray-700"}];

function PMSScreen({plate,odometer,date,techName,rwaNumber,existingPMS,itemResults,onSubmit}){
  const DRAFT_KEY="fms:draft:pms:v1";
  const DRAFT_PLATE=plate+"|"+date;
  const loadDraft=()=>{try{const raw=sessionStorage.getItem(DRAFT_KEY);if(!raw)return null;const d=JSON.parse(raw);return d?.key===DRAFT_PLATE?d:null;}catch(_){return null;}};
  const draft=loadDraft();
  const servicePhotoRef=useRef();
  const servicePhotoGalRef=useRef();
  const ecuPhotoRef=useRef();
  const ecuPhotoGalRef=useRef();
  const tcPhotoRef=useRef();
  const tcPhotoGalRef=useRef();
  const [viewPhoto,setViewPhoto]=useState(null);
  const [activeTab,setActiveTab]=useState(null);
  const [checkedItems,setCheckedItems]=useState(draft?.checkedItems||{});
  const [serviceDetails,setServiceDetails]=useState(draft?.serviceDetails||{});
  const [activePhotoCode,setActivePhotoCode]=useState(null);
  const [ecuData,setEcuData]=useState(draft?.ecuData||{performed:true,codes:[],scanNotes:"",photos:[]});
  const [newTroubleCode,setNewTroubleCode]=useState({code:"",description:""});
  const [otherNote,setOtherNote]=useState(draft?.otherNote||"");
  const [pmsNotes,setPmsNotes]=useState(draft?.pmsNotes||"");
  const [laborTypes,setLaborTypes]=useState(draft?.laborTypes||{});
  const [otherLabor,setOtherLabor]=useState(draft?.otherLabor||"");
  const [submitting,setSubmitting]=useState(false);
  const autoLinkedRef=useRef(!!draft);
  useEffect(()=>{try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify({key:DRAFT_PLATE,checkedItems,serviceDetails,ecuData,otherNote,pmsNotes,laborTypes,otherLabor}));}catch(_){}},[DRAFT_PLATE,checkedItems,serviceDetails,ecuData,otherNote,pmsNotes,laborTypes,otherLabor]);

  // Auto-link: if inspection marked an item as replaced, auto-check matching PMS item
  useEffect(()=>{if(autoLinkedRef.current)return;autoLinkedRef.current=true;const autoChecked={};const autoDetails={};Object.entries(INSP_TO_PMS).forEach(([inspCode,pmsCode])=>{const r=itemResults?.[inspCode];if(r?.resultCode==="replaced"){autoChecked[pmsCode]=true;autoDetails[pmsCode]={qty:r.partQty||1,photos:r.photos||[],brand:r.partReplaced||""};}});if(Object.keys(autoChecked).length>0){setCheckedItems(prev=>({...prev,...autoChecked}));setServiceDetails(prev=>({...prev,...autoDetails}));}},[]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle=(code)=>{setCheckedItems(prev=>{const newVal=!prev[code];if(newVal){setServiceDetails(sd=>({...sd,[code]:sd[code]||{qty:1,photos:[],brand:""}}));}return{...prev,[code]:newVal};});};
  const updateDetail=(code,field,value)=>setServiceDetails(sd=>({...sd,[code]:{...(sd[code]||{qty:1,photos:[],brand:""}),[field]:value}}));
  const addServicePhoto=(code,src)=>setServiceDetails(sd=>({...sd,[code]:{...(sd[code]||{qty:1,photos:[],brand:""}),photos:[...(sd[code]?.photos||[]),src]}}));
  const removeServicePhoto=(code,idx)=>setServiceDetails(sd=>{const p=[...(sd[code]?.photos||[])];p.splice(idx,1);return{...sd,[code]:{...sd[code],photos:p}};});

  const handleServicePhotoFile=async(e)=>{const f=e.target.files[0];if(!f||!activePhotoCode)return;const compressed=await compressImage(f);addServicePhoto(activePhotoCode,compressed);e.target.value="";setActivePhotoCode(null);};
  const handlePhotoFile=async(e,target)=>{const f=e.target.files[0];if(!f)return;const compressed=await compressImage(f);if(target==="ecu"){setEcuData(prev=>({...prev,photos:[...prev.photos,compressed]}));}else if(typeof target==="number"){setEcuData(prev=>{const codes=[...prev.codes];codes[target]={...codes[target],photo:compressed};return{...prev,codes};});}e.target.value="";};

  const laborCount=Object.values(laborTypes).filter(Boolean).length;
  const totalServiced=Object.values(checkedItems).filter(v=>v===true).length+1+(otherNote.trim()?1:0)+laborCount;
  const getStatus=(code)=>{const rec=existingPMS?.[code];if(!rec)return null;return pmsUrgency(daysUntilDue(rec.nextDate),kmUntilDue(rec.nextOdo,odometer));};

  const buildUpdates=()=>{const updates={};PMS_ITEMS.forEach(item=>{if(!checkedItems[item.code])return;const{nextOdo,nextDate}=calcNextDue(odometer,date,item.kmInterval,item.monthInterval);const detail=serviceDetails[item.code]||{qty:1,photos:[],brand:""};updates[item.code]={lastDate:date,lastOdo:parseInt(odometer),nextOdo,nextDate,performedBy:techName,rwaNumber,brand:detail.brand||null,qty:detail.qty||1,photos:detail.photos||[]};});return updates;};

  const addTroubleCode=()=>{if(!newTroubleCode.code.trim())return;setEcuData(prev=>({...prev,codes:[...prev.codes,{...newTroubleCode,photo:null}]}));setNewTroubleCode({code:"",description:""});};
  const removeTroubleCode=(idx)=>setEcuData(prev=>({...prev,codes:prev.codes.filter((_,i)=>i!==idx)}));

  const ServiceRow=({item})=>{
    const checked=!!checkedItems[item.code];
    const detail=serviceDetails[item.code]||{qty:1,photos:[],brand:""};
    const status=getStatus(item.code);
    const rec=existingPMS?.[item.code];
    const nextKm=item.kmInterval?parseInt(odometer||0)+item.kmInterval:null;
    const isTrouble=item.category==="troubleshooting";
    const bgActive=isTrouble?"bg-blue-50":"bg-green-50";
    const borderColor=isTrouble?"border-blue-200":"border-green-200";
    const focusBorder=isTrouble?"focus:border-blue-500":"focus:border-green-500";
    return(
      <div className="border-b border-gray-100 last:border-0">
        <button onClick={()=>toggle(item.code)} className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all ${checked?bgActive:"hover:bg-gray-50"}`}>
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 ${checked?(isTrouble?"bg-blue-600 border-blue-600":"bg-green-600 border-green-600"):"border-gray-300"}`}>{checked&&<span className="text-white text-xs font-black">✓</span>}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5"><span className="text-base">{item.icon}</span><span className="font-bold text-gray-800 text-sm">{item.label}</span>{status&&!checked&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>}{checked&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isTrouble?"bg-blue-100 text-blue-700":"bg-green-100 text-green-700"}`}>Done ✓</span>}</div>
            <div className="text-xs text-gray-400">{item.note}</div>
            {rec&&!checked&&<div className="text-xs text-gray-400 mt-0.5">Last: {rec.lastDate}{rec.nextDate?` · Next: ${rec.nextDate}`:""}{rec.nextOdo?` / ${rec.nextOdo.toLocaleString()} km`:""}</div>}
            {checked&&nextKm&&<div className="text-xs text-green-600 font-semibold mt-0.5">→ Next due: {nextKm.toLocaleString()} km</div>}
          </div>
          <div className="text-right shrink-0 text-xs text-gray-400">{item.kmInterval?<div>{item.kmInterval.toLocaleString()} km</div>:<div className="text-blue-400 font-bold">On-demand</div>}{item.monthInterval?<div>{item.monthInterval} mo</div>:null}</div>
        </button>
        {checked&&(
          <div className={`px-4 pb-4 pt-3 border-t ${borderColor} space-y-3 ${bgActive}`}>
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">🔩 Part / Material Used</div>
              <input type="text" placeholder="e.g. Metax Extreme 5W-40, Bosch oil filter, Bendix brake pads..." value={detail.brand} onChange={e=>updateDetail(item.code,'brand',e.target.value)} className={`w-full border-2 ${borderColor} ${focusBorder} rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none bg-white`}/>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Quantity</div>
              <div className="flex items-center gap-3">
                <button onClick={()=>updateDetail(item.code,'qty',Math.max(1,(detail.qty||1)-1))} className={`w-9 h-9 bg-white border-2 ${borderColor} rounded-xl font-black text-xl text-gray-600 flex items-center justify-center active:scale-95`}>−</button>
                <span className="text-xl font-black text-gray-800 w-10 text-center">{detail.qty||1}</span>
                <button onClick={()=>updateDetail(item.code,'qty',(detail.qty||1)+1)} className={`w-9 h-9 bg-white border-2 ${borderColor} rounded-xl font-black text-xl text-gray-600 flex items-center justify-center active:scale-95`}>+</button>
                {(detail.qty||1)>1&&<span className="text-xs text-gray-500 font-semibold">{detail.qty}× {detail.brand||"units"}</span>}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">📷 Documentation Photos <span className="ml-1 text-gray-400 normal-case font-normal">(old part / new part / installation)</span></div>
              <div className="flex flex-wrap gap-2">
                {(detail.photos||[]).map((src,i)=>(<div key={i} className="relative w-20 h-20"><img src={src} onClick={()=>setViewPhoto(src)} className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 cursor-pointer" alt={`Photo ${i+1}`}/><button onClick={()=>removeServicePhoto(item.code,i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow">✕</button><div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-center rounded-b-xl py-0.5 pointer-events-none" style={{fontSize:"8px"}}>{i===0?"Before":i===1?"New Part":"After"} · {b64size(src)} KB</div></div>))}
                {(detail.photos||[]).length<5&&(<><button type="button" onClick={()=>{setActivePhotoCode(item.code);setTimeout(()=>servicePhotoRef.current?.click(),50);}} className={`w-20 h-20 rounded-xl border-2 border-dashed ${isTrouble?"border-blue-300 text-blue-400":"border-green-300 text-green-500"} flex flex-col items-center justify-center bg-white hover:opacity-80`}><div className="text-2xl">📷</div><div className="text-xs font-bold mt-0.5">Camera</div><div className="text-xs text-gray-400">{(detail.photos||[]).length}/5</div></button><button type="button" onClick={()=>{setActivePhotoCode(item.code);setTimeout(()=>servicePhotoGalRef.current?.click(),50);}} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 flex flex-col items-center justify-center bg-white hover:border-blue-400 hover:text-blue-500"><div className="text-2xl">🖼️</div><div className="text-xs font-bold mt-0.5">Gallery</div></button></>)}
              </div>
              {(detail.photos||[]).length===0&&<div className="text-xs text-gray-400 mt-1.5 italic">Add photos: before, new part, and after installation</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return(
    <div className="min-h-screen bg-gray-50">
      <input ref={servicePhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleServicePhotoFile}/>
      <input ref={servicePhotoGalRef} type="file" accept="image/*" className="hidden" onChange={handleServicePhotoFile}/>
      <div className="bg-red-700 text-white px-4 pt-12 pb-5">
        <div className="text-xs font-bold tracking-widest text-red-300 mb-0.5">STEP 3 OF 3</div>
        <div className="text-2xl font-black">Services & Procedures</div>
        <div className="text-red-200 text-sm mt-0.5">{plate} · {odometer} km · {date}</div>
        {totalServiced>0&&<div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">✓ {totalServiced} service{totalServiced>1?"s":""} recorded</div>}
      </div>
      <div className="px-4 pt-5 pb-36 space-y-4">
        {/* ECU SCAN — mandatory */}
        <div className="bg-blue-600 rounded-2xl overflow-hidden border-2 border-blue-600">
          <div className="px-4 py-3.5 flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">💻</div><div className="flex-1"><div className="font-black text-white text-base">ECU Scanning</div><div className="text-blue-100 text-xs mt-0.5">Mandatory — performed on every visit</div></div><span className="text-xs font-black bg-white text-blue-700 px-2.5 py-1 rounded-full">Required ✓</span></div>
          <div className="bg-white mx-3 mb-3 rounded-xl p-4 space-y-3">
            <div>
              <div className="text-xs font-black text-gray-700 uppercase tracking-wide mb-2 flex items-center justify-between"><span>Trouble Codes (DTCs)</span><span className={`font-bold normal-case ${ecuData.codes.length>0?"text-red-600":"text-green-600"}`}>{ecuData.codes.length>0?`${ecuData.codes.length} code${ecuData.codes.length>1?"s":""} found`:"No codes yet"}</span></div>
              {ecuData.codes.map((tc,idx)=>(<div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2"><div className="flex items-start justify-between gap-2 mb-1"><div className="flex-1"><span className="font-black text-red-700 text-sm font-mono tracking-wide">{tc.code}</span>{tc.description&&<div className="text-gray-600 text-xs mt-0.5">{tc.description}</div>}</div><button onClick={()=>removeTroubleCode(idx)} className="text-gray-400 hover:text-red-600 text-lg leading-none shrink-0 w-6 h-6 flex items-center justify-center">✕</button></div>{tc.photo?(<div className="relative w-20 h-20 mt-2"><img src={tc.photo} className="w-20 h-20 rounded-lg object-cover border border-red-200"/><button onClick={()=>setEcuData(prev=>{const codes=[...prev.codes];codes[idx]={...codes[idx],photo:null};return{...prev,codes};})} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center">✕</button></div>):(<div className="mt-1.5 flex gap-3"><button type="button" onClick={()=>{tcPhotoRef.current?.setAttribute('data-idx',String(idx));tcPhotoRef.current?.click();}} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:text-blue-800">📷 Camera</button><button type="button" onClick={()=>{tcPhotoGalRef.current?.setAttribute('data-idx',String(idx));tcPhotoGalRef.current?.click();}} className="text-xs text-gray-600 font-bold flex items-center gap-1 hover:text-blue-800">🖼️ Gallery</button></div>)}</div>))}
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-3 space-y-2 bg-blue-50">
                <div className="text-xs font-bold text-blue-600">+ Add Trouble Code</div>
                <input type="text" placeholder="DTC Code (e.g. P0300)" value={newTroubleCode.code} onChange={e=>setNewTroubleCode(prev=>({...prev,code:e.target.value.toUpperCase()}))} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-blue-500 bg-white"/>
                <input type="text" placeholder="Description (e.g. Random misfire detected)" value={newTroubleCode.description} onChange={e=>setNewTroubleCode(prev=>({...prev,description:e.target.value}))} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"/>
                <div className="flex gap-2">
                  <button onClick={addTroubleCode} disabled={!newTroubleCode.code.trim()} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${newTroubleCode.code.trim()?"bg-blue-600 text-white active:scale-95":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>Add Code</button>
                  {ecuData.codes.length===0&&(<button onClick={()=>setEcuData(prev=>({...prev,codes:[{code:"NO DTC",description:"No trouble codes found — all systems clear",photo:null}]}))} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-green-100 text-green-700 active:scale-95">✓ No Codes</button>)}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Scan Report Photos</div>
              <div className="flex flex-wrap gap-2">{ecuData.photos.map((src,i)=>(<div key={i} className="relative w-16 h-16"><img src={src} onClick={()=>setViewPhoto(src)} className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 cursor-pointer"/><button onClick={()=>setEcuData(prev=>({...prev,photos:prev.photos.filter((_,pi)=>pi!==i)}))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center">✕</button><div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center rounded-b-xl pointer-events-none" style={{fontSize:"7px",padding:"1px 0"}}>{b64size(src)} KB</div></div>))}{ecuData.photos.length<5&&(<><button type="button" onClick={()=>ecuPhotoRef.current?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-400 hover:border-blue-500"><div className="text-lg">📷</div><div className="text-xs font-bold">Camera</div></button><button type="button" onClick={()=>ecuPhotoGalRef.current?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500"><div className="text-lg">🖼️</div><div className="text-xs font-bold">Gallery</div></button></>)}</div>
              <input ref={ecuPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>handlePhotoFile(e,"ecu")}/>
              <input ref={ecuPhotoGalRef} type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoFile(e,"ecu")}/>
              <input ref={tcPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const idx=parseInt(tcPhotoRef.current?.getAttribute('data-idx')||'0');handlePhotoFile(e,idx);}}/>
              <input ref={tcPhotoGalRef} type="file" accept="image/*" className="hidden" onChange={e=>{const idx=parseInt(tcPhotoGalRef.current?.getAttribute('data-idx')||'0');handlePhotoFile(e,idx);}}/>
            </div>
            <div><div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Scan Notes</div><textarea rows={2} placeholder="e.g. Battery low during scan, cleared stored codes after repair..." value={ecuData.scanNotes} onChange={e=>setEcuData(prev=>({...prev,scanNotes:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"/></div>
          </div>
        </div>

        {/* JOB ORDER / LABOR */}
        <div className="rounded-2xl border-2 border-gray-700 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-800 flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">👷</div><div className="flex-1"><div className="font-black text-white text-base">Job Order / Labor</div><div className="text-gray-300 text-xs mt-0.5">Select all labor types performed this visit</div></div>{laborCount>0&&<span className="text-xs font-black bg-white text-gray-800 px-2.5 py-1 rounded-full">{laborCount} selected</span>}</div>
          <div className="bg-white">
            {LABOR_TYPES.map(lt=>{const checked=!!laborTypes[lt.code];return(<div key={lt.code}><button onClick={()=>setLaborTypes(prev=>({...prev,[lt.code]:!prev[lt.code]}))} className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 last:border-0 transition-all ${checked?"bg-gray-50":""}`}><div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${checked?"bg-gray-800 border-gray-800":"border-gray-300"}`}>{checked&&<span className="text-white text-xs font-black">✓</span>}</div><span className="text-base shrink-0">{lt.icon}</span><span className={`text-sm ${checked?"font-bold text-gray-800":"text-gray-600"}`}>{lt.label}</span></button>{lt.code==="LBR_OTHER"&&checked&&(<div className="px-4 pb-3 pt-1 bg-gray-50"><textarea rows={2} placeholder="Describe labor performed..." value={otherLabor} onChange={e=>setOtherLabor(e.target.value)} className="w-full border-2 border-gray-200 focus:border-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"/></div>)}</div>);})}
          </div>
        </div>

        {/* SERVICE TABS */}
        <div className="space-y-2">{SERVICE_TABS.map(tab=>{const isOpen=activeTab===tab.key;const itemsInTab=tab.key==="other"?[]:PMS_ITEMS.filter(i=>i.category===(tab.key==="pms"?"scheduled":tab.key));const doneInTab=tab.key==="other"?(otherNote.trim()?1:0):itemsInTab.filter(i=>checkedItems[i.code]).length;return(<div key={tab.key} className={`rounded-2xl border-2 overflow-hidden transition-all ${isOpen?tab.border:"border-gray-200"}`}><button onClick={()=>setActiveTab(isOpen?null:tab.key)} className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all ${isOpen?tab.light:"bg-white hover:bg-gray-50"}`}><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isOpen?tab.color+" text-white":"bg-gray-100"}`}>{tab.icon}</div><div className="flex-1"><div className={`font-black text-base ${isOpen?tab.text:"text-gray-800"}`}>{tab.label}</div><div className="text-xs text-gray-400 mt-0.5">{tab.key==="pms"&&"Scheduled interval-based maintenance"}{tab.key==="brake"&&"Brake pads, rotors, drums & components"}{tab.key==="major"&&"Master Garage specialised services"}{tab.key==="troubleshooting"&&"Diagnostic procedures & ECU scanning"}{tab.key==="other"&&"Any other service or repair performed"}</div></div><div className="flex items-center gap-2 shrink-0">{doneInTab>0&&(<span className={`text-xs font-black px-2.5 py-1 rounded-full text-white ${tab.color}`}>{doneInTab} done</span>)}<span className={`text-lg transition-transform ${isOpen?"rotate-180":""} text-gray-400`}>▼</span></div></button>{isOpen&&tab.key==="pms"&&<div className="border-t border-gray-100">{PMS_ITEMS.filter(i=>i.category==="scheduled").map(item=>(<ServiceRow key={item.code} item={item}/>))}</div>}{isOpen&&tab.key==="brake"&&<div className="border-t border-gray-100">{PMS_ITEMS.filter(i=>i.category==="brake").map(item=>(<ServiceRow key={item.code} item={item}/>))}</div>}{isOpen&&tab.key==="major"&&<div className="border-t border-gray-100">{PMS_ITEMS.filter(i=>i.category==="major").map(item=>(<ServiceRow key={item.code} item={item}/>))}</div>}{isOpen&&tab.key==="troubleshooting"&&<div className="border-t border-gray-100">{PMS_ITEMS.filter(i=>i.category==="troubleshooting"&&i.code!=="PMS_ECU").map(item=>(<ServiceRow key={item.code} item={item}/>))}</div>}{isOpen&&tab.key==="other"&&(<div className="border-t border-gray-100 p-4"><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Describe the service or repair performed</div><textarea rows={4} placeholder="e.g. Replaced rear strut mounts, balanced all four wheels..." value={otherNote} onChange={e=>setOtherNote(e.target.value)} className="w-full border-2 border-gray-200 focus:border-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"/>{otherNote.trim()&&<div className="mt-2 text-xs text-green-600 font-semibold">✓ Other service recorded</div>}</div>)}</div>);})}</div>

        {totalServiced>0&&(<div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">General Notes (optional)</div><textarea rows={3} placeholder="e.g. Used Castrol GTX 20W-50, recommended wheel alignment at next visit..." value={pmsNotes} onChange={e=>setPmsNotes(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"/></div>)}
        {totalServiced===0&&!activeTab&&(<div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center"><div className="text-3xl mb-2">🔧</div><div className="text-sm font-semibold text-gray-500">Select a category above</div><div className="text-xs text-gray-400 mt-1">Tap any option to record services performed this visit</div></div>)}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <button disabled={submitting} onClick={async()=>{if(submitting)return;setSubmitting(true);try{await onSubmit({items:checkedItems,serviceDetails,ecuData,laborTypes:LABOR_TYPES.filter(lt=>laborTypes[lt.code]).map(lt=>({code:lt.code,label:lt.label})),otherLabor:laborTypes.LBR_OTHER&&otherLabor.trim()?otherLabor.trim():null,otherNote:otherNote.trim()||null,notes:pmsNotes,updates:buildUpdates()});}finally{setSubmitting(false);}}} className={`w-full rounded-2xl py-4 font-black text-lg shadow-lg transition-all ${submitting?"bg-gray-400 text-white cursor-not-allowed":"bg-red-700 text-white active:scale-95"}`}>{submitting?"Submitting...":totalServiced>1?`Submit + Record ${totalServiced} Services →`:"Submit Assessment + ECU Scan →"}</button>
      </div>
      <PhotoLightbox src={viewPhoto} onClose={()=>setViewPhoto(null)}/>
    </div>
  );
}

// QUICK FIX SCREEN — documents replaced parts for flagged items in a Re-Assessment, then labor selection
function QuickFixScreen({plate,odometer,date,techName,prevAssessment,onSubmit,onBack}){
  const flagged=ALL_ITEMS.filter(i=>{const r=prevAssessment?.itemResults?.[i.code];return r?.resultCode==="fail_critical"||r?.resultCode==="monitor";});
  const DRAFT_KEY="fms:draft:quickfix:v1";
  const DRAFT_ID=(prevAssessment?.rwaNumber||plate)+"|"+date;
  const loadDraft=()=>{try{const raw=sessionStorage.getItem(DRAFT_KEY);if(!raw)return null;const d=JSON.parse(raw);return d?.key===DRAFT_ID?d:null;}catch(_){return null;}};
  const draft=loadDraft();
  const [repairs,setRepairs]=useState(()=>{if(draft?.repairs)return draft.repairs;const init={};flagged.forEach(i=>{init[i.code]={skip:false,partReplaced:"",qty:1,afterMeasure:"",note:"",photos:[]};});return init;});
  const [laborTypes,setLaborTypes]=useState(draft?.laborTypes||{});
  const [otherLabor,setOtherLabor]=useState(draft?.otherLabor||"");
  const [saving,setSaving]=useState(false);
  useEffect(()=>{try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify({key:DRAFT_ID,repairs,laborTypes,otherLabor}));}catch(_){}},[DRAFT_ID,repairs,laborTypes,otherLabor]);

  const updateRepair=(code,field,value)=>setRepairs(prev=>({...prev,[code]:{...prev[code],[field]:value}}));
  const addPhoto=(code,src)=>setRepairs(prev=>({...prev,[code]:{...prev[code],photos:[...(prev[code].photos||[]),src]}}));
  const removePhoto=(code,idx)=>setRepairs(prev=>{const p=[...(prev[code].photos||[])];p.splice(idx,1);return{...prev,[code]:{...prev[code],photos:p}};});

  const repairedCount=flagged.filter(i=>!repairs[i.code].skip).length;
  const canSubmit=flagged.length>0&&flagged.every(i=>{const r=repairs[i.code];if(r.skip)return true;if(!r.partReplaced.trim())return false;if(i.type==="measurable"&&!r.afterMeasure)return false;return true;});
  const laborCount=Object.values(laborTypes).filter(Boolean).length;

  const handleSubmit=async()=>{
    if(!canSubmit||saving)return;
    setSaving(true);
    try{
      const newItemResults={...prevAssessment.itemResults};
      flagged.forEach(i=>{const r=repairs[i.code];if(r.skip)return;const prev=prevAssessment.itemResults[i.code]||{};newItemResults[i.code]={resultCode:"replaced",defectCode:prev.defectCode||null,measuredValue:prev.measuredValue,partReplaced:r.partReplaced.trim(),partQty:r.qty||1,afterMeasure:r.afterMeasure||undefined,note:r.note.trim()||undefined,photos:r.photos||[]};});
      const items={};const serviceDetails={};const updates={};
      Object.entries(newItemResults).forEach(([inspCode,rr])=>{if(rr.resultCode!=="replaced"||!INSP_TO_PMS[inspCode])return;const pmsCode=INSP_TO_PMS[inspCode];const pmsItem=PMS_ITEMS.find(p=>p.code===pmsCode);if(!pmsItem)return;const{nextOdo,nextDate}=calcNextDue(odometer,date,pmsItem.kmInterval,pmsItem.monthInterval);items[pmsCode]=true;serviceDetails[pmsCode]={qty:rr.partQty||1,photos:rr.photos||[],brand:rr.partReplaced||""};updates[pmsCode]={lastDate:date,lastOdo:parseInt(odometer),nextOdo,nextDate,performedBy:techName,rwaNumber:"PENDING",brand:rr.partReplaced||null,qty:rr.partQty||1,photos:rr.photos||[]};});
      const pmsData={items,serviceDetails,ecuData:null,laborTypes:LABOR_TYPES.filter(lt=>laborTypes[lt.code]).map(lt=>({code:lt.code,label:lt.label})),otherLabor:laborTypes.LBR_OTHER&&otherLabor.trim()?otherLabor.trim():null,otherNote:null,notes:"Quick Fix",updates};
      await onSubmit(pmsData,newItemResults);
    }finally{setSaving(false);}
  };

  return(
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Quick Fix" sub={`${plate} — Document replaced parts`} onBack={onBack}/>
      <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-2"><span>🔧</span><span className="text-xs font-bold">Quick Fix — all flagged items will be marked as Replaced</span></div>
      <div className="px-4 pt-4 pb-32 space-y-3">
        {flagged.length===0&&(<div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center"><div className="text-3xl mb-2">✅</div><div className="text-sm font-semibold text-gray-500">No flagged items from previous assessment</div></div>)}
        {flagged.map(item=>{const r=repairs[item.code];const prev=prevAssessment.itemResults[item.code]||{};const isCrit=prev.resultCode==="fail_critical";const skipped=r.skip;return(
          <div key={item.code} className={`rounded-2xl border-2 ${skipped?"border-gray-300 opacity-70":isCrit?"border-red-300":"border-amber-300"} bg-white overflow-hidden`}>
            <div className={`px-4 py-3 ${skipped?"bg-gray-100":isCrit?"bg-red-50":"bg-amber-50"} flex items-start gap-2`}>
              <span className={`shrink-0 text-xs font-black px-2 py-1 rounded-lg ${isCrit?"bg-red-600 text-white":"bg-amber-500 text-white"}`}>{isCrit?"CRIT":"MON"}</span>
              <div className="flex-1 min-w-0"><div className="font-bold text-gray-800 text-sm">{item.label}</div>{prev.defectCode&&<div className="text-xs text-gray-500 mt-0.5">Defect: {DEFECT_CODES[prev.defectCode]}</div>}{prev.measuredValue!==undefined&&prev.measuredValue!==""&&<div className="text-xs text-red-600 font-semibold mt-0.5">Before: {prev.measuredValue}{item.unit}{item.threshold?` / Min: ${item.threshold}${item.unit}`:""}</div>}</div>
            </div>
            <div className="px-4 pt-3 pb-1 flex gap-2">
              <button type="button" onClick={()=>updateRepair(item.code,"skip",false)} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${!skipped?"bg-green-600 text-white shadow":"bg-gray-100 text-gray-500"}`}>🔩 Repair</button>
              <button type="button" onClick={()=>updateRepair(item.code,"skip",true)} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${skipped?"bg-gray-700 text-white shadow":"bg-gray-100 text-gray-500"}`}>⏭ Skip (not repaired)</button>
            </div>
            {skipped?(<div className="px-4 pb-4 pt-2"><div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 font-semibold">This item will remain {isCrit?"flagged as critical":"flagged for monitoring"}. Dispatch hold will persist if any critical item is skipped.</div></div>):(
            <div className="p-4 space-y-3">
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Part Replaced *</label><input value={r.partReplaced} onChange={e=>updateRepair(item.code,"partReplaced",e.target.value)} placeholder="e.g. Brake Pad Set (Front)" className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Quantity</label><div className="flex items-center gap-2"><button type="button" onClick={()=>updateRepair(item.code,"qty",Math.max(1,(r.qty||1)-1))} className="w-9 h-9 bg-white border-2 border-gray-200 rounded-xl font-black text-xl text-gray-600 flex items-center justify-center active:scale-95">−</button><span className="text-lg font-black text-gray-800 w-10 text-center">{r.qty||1}</span><button type="button" onClick={()=>updateRepair(item.code,"qty",(r.qty||1)+1)} className="w-9 h-9 bg-white border-2 border-gray-200 rounded-xl font-black text-xl text-gray-600 flex items-center justify-center active:scale-95">+</button></div></div>
                {item.type==="measurable"&&(<div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">After ({item.unit}) *</label><input type="number" step="0.01" value={r.afterMeasure} onChange={e=>updateRepair(item.code,"afterMeasure",e.target.value)} placeholder={`Min ${item.threshold}`} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"/>{r.afterMeasure&&parseFloat(r.afterMeasure)>=item.threshold&&<div className="text-xs font-bold text-green-600 mt-1">✓ OK</div>}{r.afterMeasure&&parseFloat(r.afterMeasure)<item.threshold&&<div className="text-xs font-bold text-red-600 mt-1">Still low</div>}</div>)}
              </div>
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Photos</label><PhotoCapture photos={r.photos} onAdd={src=>addPhoto(item.code,src)} onRemove={idx=>removePhoto(item.code,idx)}/></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Note (optional)</label><textarea rows={2} value={r.note} onChange={e=>updateRepair(item.code,"note",e.target.value)} placeholder="Optional repair notes..." className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"/></div>
            </div>
            )}
          </div>
        );})}
        {flagged.length>0&&(<div className="rounded-2xl border-2 border-gray-700 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-800 flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">👷</div><div className="flex-1"><div className="font-black text-white text-base">Job Order / Labor</div><div className="text-gray-300 text-xs mt-0.5">Select labor types performed</div></div>{laborCount>0&&<span className="text-xs font-black bg-white text-gray-800 px-2.5 py-1 rounded-full">{laborCount} selected</span>}</div>
          <div className="bg-white">{LABOR_TYPES.map(lt=>{const checked=!!laborTypes[lt.code];return(<div key={lt.code}><button onClick={()=>setLaborTypes(prev=>({...prev,[lt.code]:!prev[lt.code]}))} className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 last:border-0 transition-all ${checked?"bg-gray-50":""}`}><div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${checked?"bg-gray-800 border-gray-800":"border-gray-300"}`}>{checked&&<span className="text-white text-xs font-black">✓</span>}</div><span className="text-base shrink-0">{lt.icon}</span><span className={`text-sm ${checked?"font-bold text-gray-800":"text-gray-600"}`}>{lt.label}</span></button>{lt.code==="LBR_OTHER"&&checked&&(<div className="px-4 pb-3 pt-1 bg-gray-50"><textarea rows={2} placeholder="Describe labor performed..." value={otherLabor} onChange={e=>setOtherLabor(e.target.value)} className="w-full border-2 border-gray-200 focus:border-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"/></div>)}</div>);})}</div>
        </div>)}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <button disabled={!canSubmit||saving} onClick={handleSubmit} className={`w-full rounded-2xl py-4 font-black text-lg transition-all ${canSubmit&&!saving?"bg-red-700 text-white shadow-lg active:scale-95":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{saving?"Submitting...":canSubmit?`✓ Submit Quick Fix (${repairedCount} repaired${flagged.length-repairedCount>0?`, ${flagged.length-repairedCount} skipped`:""})`:"Fill all required fields or skip"}</button>
      </div>
    </div>
  );
}

function SupervisorPanel({a,defaultName,onSave,onClose}){const[remarks,setRemarks]=useState(a.supervisorRemarks||"");const[newDate,setNewDate]=useState(a.classification.reassessmentDue||"");const[cleared,setCleared]=useState(a.supervisorCleared||false);const[name,setName]=useState(a.supervisorName||defaultName||"");return(<div className="fixed inset-0 bg-black/60 z-50 flex items-end"><div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"><div className="flex items-center justify-between mb-1"><div><div className="font-black text-lg text-gray-800">Supervisor Review</div><div className="text-xs text-gray-400">{a.rwaNumber} · {a.header.plate}</div></div><button onClick={onClose} className="text-gray-400 text-2xl">✕</button></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Supervisor Name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter supervisor name" className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"/></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Supervisor Remarks</label><textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3} placeholder="Add remarks, override justification, or corrective action notes..." className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"/></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Override Reassessment Date</label><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"/></div>{!a.classification.dispatchAllowed&&(<div className={`rounded-2xl border-2 p-4 transition-all ${cleared?"border-green-400 bg-green-50":"border-gray-200"}`}><label className="flex items-center gap-3 cursor-pointer"><div onClick={()=>setCleared(!cleared)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${cleared?"bg-green-600 border-green-600 text-white":"border-gray-300"}`}>{cleared?"✓":""}</div><div><div className="font-bold text-gray-800 text-sm">Clear unit for dispatch</div><div className="text-xs text-gray-400">Override dispatch block — supervisor authority required</div></div></label>{cleared&&(<div className="mt-3 bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-xl">✓ Supervisor clearance will be recorded with your name and timestamp</div>)}</div>)}<div className="flex gap-3 pt-2"><button onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 rounded-2xl py-3 font-bold">Cancel</button><button disabled={!name.trim()} onClick={()=>onSave({remarks,reassessmentDue:newDate,cleared,name,ts:new Date().toISOString()})} className={`flex-1 rounded-2xl py-3 font-bold transition-all ${name.trim()?"bg-blue-600 text-white":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Save Override</button></div></div></div>);}

function VehicleProfile({plate,allAssessments,pmsRecords,onBack,onStartReassess,onViewAssessment,onViewPhoto}){
  const[tab,setTab]=useState("history");
  const history=allAssessments.filter(a=>a.header.plate===plate).sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));
  const latest=history[0];const score=latest?calcHealthScore(latest.classification,latest.itemResults):100;const hc=healthColor(score);
  const repeats=getRepeatDefects(history);const repeatWarnings=Object.entries(repeats).filter(([,cnt])=>cnt>=2).sort((a,b)=>b[1]-a[1]);
  const trends=ALL_ITEMS.filter(i=>i.type==="measurable").map(item=>({item,data:getMeasurableTrend(history,item.code)})).filter(t=>t.data.length>=2);
  if(!latest)return(<div className="min-h-screen bg-gray-50"><TopBar title={plate} sub="Vehicle Profile" onBack={onBack}/><div className="text-center py-20 text-gray-400"><div className="text-4xl mb-3">🚗</div><div className="font-semibold">No assessments found for this plate</div></div></div>);
  const latestCfg=SC[latest.classification.overallStatus];const vehiclePMS=pmsRecords?.[plate]||{};const currentOdo=parseInt(latest.header.odometer)||0;
  return(
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-b ${latestCfg.grad} text-white px-4 pt-12 pb-6`}><button onClick={onBack} className="text-white/60 text-2xl mb-3 block">←</button><div className="flex items-start justify-between"><div><div className="text-xs font-bold tracking-widest opacity-60">VEHICLE PROFILE</div><div className="text-3xl font-black">{plate}</div><div className="text-white/70 text-sm">{latest.header.client}</div>{(latest.header.make||latest.header.model)&&<div className="text-white/60 text-sm">{latest.header.make} {latest.header.model}{latest.header.yearModel?` (${latest.header.yearModel})`:""}</div>}<div className="text-white/60 text-xs mt-0.5">{latest.header.branch}</div></div><div className={`${hc.bg} rounded-2xl p-3 text-center min-w-[72px]`}><div className={`text-2xl font-black ${hc.text}`}>{score}</div><div className={`text-xs font-bold ${hc.text}`}>Health</div></div></div><div className="mt-3 flex items-center gap-2"><Badge label={latestCfg.label} color={latest.classification.dispatchAllowed?"bg-green-500 text-white":"bg-black/30 text-white"}/><span className="text-white/50 text-xs">{history.length} assessment{history.length!==1?"s":""} on record</span></div></div>
      <div className="bg-white border-b border-gray-200 flex">{[["history","📋 History"],["pms","🔧 PMS Schedule"]].map(([k,l])=>(<button key={k} onClick={()=>setTab(k)} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab===k?"border-red-700 text-red-700":"border-transparent text-gray-400"}`}>{l}</button>))}</div>
      <div className="px-4 pt-4 pb-28 space-y-4">
        {tab==="history"&&(<div className="space-y-4">
          {repeatWarnings.length>0&&(<div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-4"><div className="font-black text-orange-700 mb-2 text-sm">🔁 Repeat Defects Detected</div><div className="text-xs text-orange-600 mb-3">Flagged across multiple assessments. Priority for repair.</div>{repeatWarnings.slice(0,5).map(([code,cnt])=>{const item=ITEM_MAP[code];if(!item)return null;return(<div key={code} className="bg-white rounded-xl p-3 mb-2 border border-orange-200 flex items-center justify-between"><div><div className="font-bold text-gray-800 text-sm">{item.label}</div><div className="text-xs text-gray-400">{CATEGORIES.find(c=>c.items.includes(item))?.label}</div></div><span className="text-xs font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full">{cnt}× flagged</span></div>);})}</div>)}
          {trends.length>0&&(<div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Measurable Value Trends</div>{trends.map(({item,data})=>{const latestVal=data[data.length-1].value;const delta=latestVal-data[0].value;const atRisk=latestVal<item.threshold*1.2;return(<div key={item.code} className={`mb-4 last:mb-0 p-3 rounded-xl border ${atRisk?"border-red-200 bg-red-50":"border-gray-100"}`}><div className="flex items-center justify-between mb-2"><span className="font-bold text-gray-800 text-sm">{item.label}</span><div className="flex items-center gap-1.5">{atRisk&&<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">At Risk</span>}{delta<0&&<span className="text-xs text-red-500 font-bold">↓ {Math.abs(delta).toFixed(2)}{item.unit}</span>}{delta>0&&<span className="text-xs text-green-500 font-bold">↑ {delta.toFixed(2)}{item.unit}</span>}</div></div><div className="flex items-end gap-2 overflow-x-auto pb-1">{data.map((pt,i)=>{const pct=Math.min(100,Math.max(5,(pt.value/(item.threshold*2))*100));const barColor=pt.value<item.threshold?"bg-red-500":pt.value<item.threshold*1.2?"bg-amber-500":"bg-green-500";return(<div key={i} className="flex flex-col items-center gap-1 min-w-[44px]"><span className={`text-xs font-bold ${pt.value<item.threshold?"text-red-600":"text-gray-600"}`}>{pt.value}</span><div className="w-8 bg-gray-200 rounded-t-sm flex items-end" style={{height:"40px"}}><div className={`w-full rounded-t-sm ${barColor}`} style={{height:`${pct}%`}}></div></div><div className="text-gray-400 text-center" style={{fontSize:"9px"}}>{pt.date.slice(5)}</div></div>);})}</div><div className="text-xs text-gray-400 mt-1">{item.thresholdLabel} · {data.length} readings</div></div>);})}</div>)}
          <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Assessment History ({history.length})</div>{history.map((a,i)=>{const cfg=SC[a.classification.overallStatus];const fails=a.classification.failCriticalCount||0;const isLatest=i===0;return(<button key={a.id} onClick={()=>onViewAssessment(a)} className={`w-full text-left rounded-xl p-3 mb-2 border transition-all hover:shadow-sm ${isLatest?"border-red-200 bg-red-50":"border-gray-100 bg-gray-50"}`}><div className="flex items-center justify-between mb-0.5"><span className="font-bold text-gray-800 text-sm">{a.rwaNumber}</span><div className="flex items-center gap-1.5">{isLatest&&<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Latest</span>}<Badge label={cfg.label} color={cfg.badge}/></div></div><div className="text-xs text-gray-400">{a.header.date} · {a.header.type} · {a.header.technician}</div><div className="flex items-center gap-2 mt-1.5 flex-wrap">{fails>0&&<span className="text-xs text-red-600 font-bold">🚨 {fails} critical</span>}{!a.classification.dispatchAllowed&&<span className="text-xs text-red-600 font-bold">⛔ Hold</span>}{a.classification.dispatchAllowed&&<span className="text-xs text-green-600 font-bold">✓ Cleared</span>}{a.supervisorCleared&&<span className="text-xs text-blue-600 font-bold">👤 Cleared</span>}{a.pmsData&&<span className="text-xs text-green-600 font-bold">🔧 PMS</span>}</div></button>);})}</div>
        </div>)}
        {tab==="pms"&&(<div className="space-y-4"><div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">PMS Schedule</div><div className="text-xs text-gray-400 mb-3">Current odometer: {currentOdo.toLocaleString()} km</div>{Object.keys(vehiclePMS).length===0&&(<div className="text-center py-6 text-gray-400"><div className="text-3xl mb-2">🔧</div><div className="text-sm font-semibold">No PMS records yet</div></div>)}{PMS_ITEMS.map(item=>{const rec=vehiclePMS[item.code];if(!rec)return null;const days=daysUntilDue(rec.nextDate);const km=kmUntilDue(rec.nextOdo,currentOdo);const status=pmsUrgency(days,km);return(<div key={item.code} className={`rounded-xl p-3 mb-2 border ${status.bg}`}><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 flex-1 min-w-0"><span className="text-xl shrink-0">{item.icon}</span><div className="min-w-0"><div className="font-bold text-gray-800 text-sm">{item.label}</div><div className="text-xs text-gray-400">Last: {rec.lastDate} @ {rec.lastOdo.toLocaleString()} km</div><div className="text-xs text-gray-400">By: {rec.performedBy}</div>{rec.brand&&<div className="text-xs text-green-700 font-semibold mt-0.5">{rec.qty>1?`${rec.qty}× `:""}{rec.brand}</div>}{rec.photos?.length>0&&(<div className="flex gap-1.5 mt-1.5 flex-wrap">{rec.photos.map((src,i)=>(<img key={i} src={src} onClick={()=>onViewPhoto?.(src)} className="w-10 h-10 rounded-lg object-cover border border-gray-200 cursor-pointer" alt={`Photo ${i+1}`}/>))}</div>)}</div></div><div className="text-right shrink-0"><span className={`text-xs font-black px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span><div className={`text-xs font-bold mt-1 ${status.color}`}>{km<0?`${Math.abs(km).toLocaleString()} km overdue`:`${km.toLocaleString()} km left`}</div><div className={`text-xs ${status.color}`}>{days<0?`${Math.abs(days)}d overdue`:`by ${rec.nextDate}`}</div></div></div></div>);})}</div></div>)}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4"><button onClick={()=>onStartReassess(latest)} className="w-full bg-red-700 text-white rounded-2xl py-4 font-black text-base active:scale-95 flex items-center justify-center gap-2">🔄 Start Re-Assessment for {plate}</button></div>
    </div>
  );
}

function PrintableReport({a,allAssessments,pmsRecords}){
  const plate=a.header.plate;
  const history=(allAssessments||[]).filter(h=>h.header.plate===plate).sort((x,y)=>new Date(y.submittedAt)-new Date(x.submittedAt));
  const latest=history[0]||a;
  const latestCls=latest.classification;
  const score=calcHealthScore(latestCls,latest.itemResults);
  const vehiclePMS=(pmsRecords||{})[plate]||{};
  const currentOdo=Math.max(...history.map(h=>parseInt(h.header.odometer)||0),0);
  const badgeClass=(v)=>v==="green"?"pr-badge-green":v==="red"?"pr-badge-red":v==="amber"?"pr-badge-amber":v==="orange"?"pr-badge-orange":"pr-badge-gray";
  const statusColor=(s)=>s==="active"?"green":s==="conditional"?"amber":"red";

  // Aggregate stats across all assessments
  const totalFails=history.reduce((s,h)=>(s+(h.classification.failCriticalCount||0)),0);
  const totalMons=history.reduce((s,h)=>(s+(h.classification.monitorCount||0)),0);
  const totalReps=history.reduce((s,h)=>(s+(h.classification.replacedCount||0)),0);
  const holdCount=history.filter(h=>!h.classification.dispatchAllowed).length;

  // All parts ever replaced across all visits
  const allReplacements=[];
  history.forEach(h=>{ALL_ITEMS.forEach(item=>{const r=h.itemResults[item.code];if(r?.resultCode==="replaced")allReplacements.push({item,r,rwa:h.rwaNumber,date:h.header.date,odo:h.header.odometer});});});

  // All defects (critical+monitor) still open on the latest assessment
  const openIssues=ALL_ITEMS.filter(i=>{const r=latest.itemResults[i.code];return r?.resultCode==="fail_critical"||r?.resultCode==="monitor";});

  // Repeat defects
  const repeats=getRepeatDefects(history);const repeatWarnings=Object.entries(repeats).filter(([,cnt])=>cnt>=2).sort((x,y)=>y[1]-x[1]);

  // Measurement trends
  const trends=ALL_ITEMS.filter(i=>i.type==="measurable").map(item=>({item,data:getMeasurableTrend(history,item.code)})).filter(t=>t.data.length>=1);

  // All ECU scans across visits
  const ecuScans=history.filter(h=>h.pmsData?.ecuData?.performed).map(h=>({rwa:h.rwaNumber,date:h.header.date,ecu:h.pmsData.ecuData}));

  // All PMS services ever performed across visits
  const allServices=[];
  history.forEach(h=>{if(!h.pmsData?.items)return;PMS_ITEMS.forEach(item=>{if(h.pmsData.items[item.code]){const detail=h.pmsData.serviceDetails?.[item.code];allServices.push({item,rwa:h.rwaNumber,date:h.header.date,odo:h.header.odometer,detail});}});});

  const firstDate=history.length>0?history[history.length-1].header.date:"—";
  const firstOdo=history.length>0?history[history.length-1].header.odometer:"—";

  return(
    <div className="print-report">
      {/* ── HEADER ── */}
      <div className="pr-header"><div className="pr-header-title">MG FLEET MANAGEMENT SYSTEM</div><div className="pr-header-sub">Master Garage Philippines — Vehicle History Report</div></div>

      {/* ── VEHICLE IDENTITY + CURRENT STATUS ── */}
      <div className={`pr-status pr-status-${latestCls.overallStatus}`}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"20pt",fontWeight:900,letterSpacing:"0.05em"}}>{plate}</div>
            <div style={{fontSize:"10pt",opacity:0.85}}>{[latest.header.make,latest.header.model,latest.header.yearModel?`(${latest.header.yearModel})`:null].filter(Boolean).join(" ")||"—"}</div>
            <div style={{fontSize:"9pt",opacity:0.7,marginTop:"2px"}}>{latest.header.client} · {latest.header.branch}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"28pt",fontWeight:900}}>{score}</div>
            <div style={{fontSize:"8pt",opacity:0.7}}>Health Score</div>
          </div>
        </div>
        <div style={{marginTop:"8px",display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <div className={`pr-dispatch ${latestCls.dispatchAllowed?"pr-dispatch-yes":"pr-dispatch-no"}`}>{latestCls.dispatchAllowed?"DISPATCH ALLOWED":"DO NOT DISPATCH"}</div>
          {latestCls.reassessmentDue&&<div style={{fontSize:"8pt",opacity:0.8,alignSelf:"center"}}>{latestCls.overallStatus==="deferred"?`Reassessment by ${latestCls.reassessmentDue}`:`Next check by ${latestCls.reassessmentDue}`}</div>}
        </div>
      </div>

      {/* ── LIFETIME STATS ── */}
      <div className="pr-section">
        <div className="pr-section-title">Vehicle Summary</div>
        <div className="pr-info-grid">
          {[["Total Assessments",String(history.length)],["First Assessed",`${firstDate} @ ${firstOdo} km`],["Latest Assessment",`${latest.header.date} @ ${latest.header.odometer} km`],["Total KM Tracked",`${firstOdo} → ${currentOdo.toLocaleString()} km`],["Lifetime Critical Flags",String(totalFails)],["Lifetime Monitored Items",String(totalMons)],["Total Parts Replaced",String(totalReps)],["Times Held from Dispatch",String(holdCount)]].map(([k,v])=>(<div key={k}><div className="pr-info-label">{k}</div><div className="pr-info-value">{v}</div></div>))}
        </div>
      </div>

      {/* ── OPEN ISSUES (latest assessment) ── */}
      {openIssues.length>0&&<div className="pr-section">
        <div className="pr-section-title" style={{color:"#b91c1c",borderBottomColor:"#fecaca"}}>Outstanding Issues — Latest Assessment ({latest.rwaNumber})</div>
        {openIssues.map(item=>{const r=latest.itemResults[item.code];const isCrit=r.resultCode==="fail_critical";return(<div key={item.code} className={`pr-finding ${isCrit?"pr-finding-crit":"pr-finding-mon"}`}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><span className="pr-finding-label">{item.label}</span><span className={`pr-badge ${isCrit?"pr-badge-red":"pr-badge-amber"}`}>{isCrit?"CRITICAL":"MONITOR"}</span></div>{r.measuredValue!==undefined&&r.measuredValue!==""&&<div className="pr-finding-detail" style={{color:isCrit?"#dc2626":"#d97706"}}>Measured: {r.measuredValue}{item.unit}{item.threshold?` — Min: ${item.threshold}${item.unit}`:""}</div>}{r.defectCode&&<div className="pr-finding-detail" style={{color:"#6b7280"}}>Defect: {DEFECT_CODES[r.defectCode]}</div>}{r.note&&<div className="pr-finding-detail" style={{color:"#6b7280",fontStyle:"italic"}}>"{r.note}"</div>}{repeats[item.code]>=2&&<div className="pr-finding-detail" style={{color:"#c2410c",fontWeight:700}}>⚠ Repeat defect — flagged {repeats[item.code]}× across assessments</div>}</div>);})}
      </div>}

      {/* ── REPEAT DEFECTS ── */}
      {repeatWarnings.length>0&&<div className="pr-section">
        <div className="pr-section-title" style={{color:"#c2410c",borderBottomColor:"#fed7aa"}}>Repeat Defect Patterns</div>
        <div style={{fontSize:"8pt",color:"#9a3412",marginBottom:"6px"}}>Items flagged in 2 or more assessments — indicates recurring or unresolved problems.</div>
        {repeatWarnings.map(([code,cnt])=>{const item=ITEM_MAP[code];if(!item)return null;const cat=CATEGORIES.find(c=>c.items.includes(item));return(<div key={code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f3f4f6"}}><div><span style={{fontWeight:700,fontSize:"9pt",color:"#1f2937"}}>{item.label}</span><span style={{fontSize:"8pt",color:"#9ca3af",marginLeft:"8px"}}>{cat?.label}</span></div><span className="pr-badge pr-badge-orange">{cnt}× across {history.length} visits</span></div>);})}
      </div>}

      {/* ── MEASUREMENT TRENDS ── */}
      {trends.length>0&&<div className="pr-section">
        <div className="pr-section-title">Measurement History</div>
        {trends.map(({item,data})=>{const latestVal=data[data.length-1].value;const atRisk=item.threshold&&latestVal<item.threshold*1.2;return(<div key={item.code} style={{marginBottom:"8px",padding:"6px 10px",borderRadius:"6px",border:"1px solid",borderColor:atRisk?"#fecaca":"#e5e7eb",background:atRisk?"#fef2f2":"#f9fafb"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}><span style={{fontWeight:700,fontSize:"9pt",color:"#1f2937"}}>{item.label}</span><div>{atRisk&&<span className="pr-badge pr-badge-red" style={{marginRight:"4px"}}>AT RISK</span>}{item.threshold&&<span style={{fontSize:"8pt",color:"#6b7280"}}>Min: {item.threshold}{item.unit}</span>}</div></div><div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>{data.map((pt,i)=>(<span key={i} style={{fontSize:"8pt",color:item.threshold&&pt.value<item.threshold?"#dc2626":"#374151"}}><strong>{pt.value}{item.unit}</strong> <span style={{color:"#9ca3af"}}>({pt.date})</span></span>))}</div></div>);})}
      </div>}

      {/* ── COMPLETE PARTS REPLACEMENT LOG ── */}
      {allReplacements.length>0&&<div className="pr-section pr-page-break">
        <div className="pr-section-title" style={{color:"#1d4ed8",borderBottomColor:"#bfdbfe"}}>Parts Replacement History ({allReplacements.length} total)</div>
        {allReplacements.map((rep,i)=>{const{item,r,rwa,date,odo}=rep;return(<div key={`${rwa}-${item.code}`} style={{padding:"5px 0",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}><div><div style={{fontWeight:700,fontSize:"9pt",color:"#1f2937"}}>{item.label}</div>{r.partReplaced&&<div style={{fontSize:"8pt",color:"#1d4ed8",fontWeight:600}}>{r.partQty&&r.partQty>1?`${r.partQty}× `:""}{r.partReplaced}</div>}{r.defectCode&&<div style={{fontSize:"8pt",color:"#6b7280"}}>Defect: {DEFECT_CODES[r.defectCode]}</div>}{r.measuredValue!==undefined&&r.measuredValue!==""&&<div style={{fontSize:"8pt",color:"#6b7280"}}>Before: {r.measuredValue}{item.unit}{r.afterMeasure&&r.afterMeasure!==""?` → After: ${r.afterMeasure}${item.unit}`:""}</div>}</div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:"8pt",color:"#6b7280"}}>{date}</div><div style={{fontSize:"8pt",color:"#9ca3af"}}>{odo} km</div><div style={{fontSize:"7pt",color:"#9ca3af"}}>{rwa}</div></div></div>);})}
      </div>}

      {/* ── ALL PMS SERVICES PERFORMED ── */}
      {allServices.length>0&&<div className="pr-section">
        <div className="pr-section-title" style={{color:"#15803d",borderBottomColor:"#bbf7d0"}}>Service History ({allServices.length} services performed)</div>
        {allServices.map((svc,i)=>{const{item,rwa,date,odo,detail}=svc;return(<div key={`${rwa}-${item.code}`} style={{padding:"5px 0",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}><div><div style={{fontWeight:600,fontSize:"9pt",color:"#1f2937"}}>{item.icon} {item.label}</div>{detail?.brand&&<div style={{fontSize:"8pt",color:"#1d4ed8",fontWeight:600}}>{detail.qty>1?`${detail.qty}× `:""}{detail.brand}</div>}</div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:"8pt",color:"#6b7280"}}>{date} @ {odo} km</div><div style={{fontSize:"7pt",color:"#9ca3af"}}>{rwa}</div></div></div>);})}
      </div>}

      {/* ── ECU SCAN HISTORY ── */}
      {ecuScans.length>0&&<div className="pr-section">
        <div className="pr-section-title" style={{color:"#1d4ed8",borderBottomColor:"#bfdbfe"}}>ECU Scan History ({ecuScans.length} scan{ecuScans.length>1?"s":""})</div>
        {ecuScans.map((scan,i)=>(<div key={scan.rwa} style={{marginBottom:"8px",padding:"8px 10px",background:"#f9fafb",borderRadius:"6px",border:"1px solid #e5e7eb"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{fontWeight:700,fontSize:"9pt",color:"#1f2937"}}>{scan.date}</span><span style={{fontSize:"8pt",color:"#9ca3af"}}>{scan.rwa}</span></div>{scan.ecu.codes?.length>0?scan.ecu.codes.map((tc,j)=>(<div key={j} style={{marginBottom:"2px"}}><span className="pr-ecu-code">{tc.code}</span>{tc.description&&<span style={{fontSize:"8pt",color:"#4b5563"}}>— {tc.description}</span>}</div>)):<div style={{fontSize:"8pt",color:"#16a34a",fontWeight:600}}>No trouble codes found</div>}{scan.ecu.scanNotes&&<div style={{fontSize:"8pt",color:"#6b7280",fontStyle:"italic",marginTop:"3px"}}>"{scan.ecu.scanNotes}"</div>}</div>))}
      </div>}

      {/* ── PMS SCHEDULE (upcoming) ── */}
      {Object.keys(vehiclePMS).length>0&&<div className="pr-section">
        <div className="pr-section-title" style={{color:"#15803d",borderBottomColor:"#bbf7d0"}}>Upcoming PMS Schedule</div>
        <div style={{fontSize:"8pt",color:"#6b7280",marginBottom:"6px"}}>Current odometer: {currentOdo.toLocaleString()} km</div>
        {PMS_ITEMS.map(item=>{const rec=vehiclePMS[item.code];if(!rec)return null;const days=daysUntilDue(rec.nextDate);const km=rec.nextOdo?kmUntilDue(rec.nextOdo,currentOdo):null;const urg=pmsUrgency(days,km!=null?km:999);return(<div key={item.code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f3f4f6"}}><div><div style={{fontWeight:600,fontSize:"9pt",color:"#1f2937"}}>{item.icon} {item.label}</div><div style={{fontSize:"8pt",color:"#9ca3af"}}>Last: {rec.lastDate} @ {rec.lastOdo?.toLocaleString()} km</div></div><div style={{textAlign:"right",flexShrink:0}}><span className={`pr-badge ${urg.label==="Overdue"||urg.label==="Due Soon"?"pr-badge-red":urg.label==="Upcoming"?"pr-badge-amber":"pr-badge-green"}`}>{urg.label}</span>{rec.nextOdo&&<div style={{fontSize:"8pt",color:"#6b7280",marginTop:"2px"}}>{km<0?`${Math.abs(km).toLocaleString()} km over`:`${km.toLocaleString()} km left`}</div>}<div style={{fontSize:"8pt",color:"#6b7280"}}>{days<0?`${Math.abs(days)}d overdue`:`by ${rec.nextDate}`}</div></div></div>);})}
      </div>}

      {/* ── ASSESSMENT TIMELINE ── */}
      <div className="pr-section pr-page-break">
        <div className="pr-section-title">Assessment Timeline ({history.length} record{history.length!==1?"s":""})</div>
        {history.map(h=>{const hCls=h.classification;const hScore=calcHealthScore(hCls,h.itemResults);const hFails=ALL_ITEMS.filter(i=>h.itemResults[i.code]?.resultCode==="fail_critical");const hMons=ALL_ITEMS.filter(i=>h.itemResults[i.code]?.resultCode==="monitor");const hReps=ALL_ITEMS.filter(i=>h.itemResults[i.code]?.resultCode==="replaced");const hasPms=h.pmsData&&(Object.values(h.pmsData.items||{}).some(Boolean)||h.pmsData.ecuData?.performed);return(<div key={h.id} style={{marginBottom:"10px",padding:"8px 12px",borderRadius:"6px",border:"1px solid #e5e7eb",background:"#f9fafb",pageBreakInside:"avoid"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}><div><div style={{fontWeight:800,fontSize:"10pt",color:"#1f2937"}}>{h.rwaNumber}</div><div style={{fontSize:"8pt",color:"#6b7280"}}>{h.header.date} · {h.header.type} · {h.header.technician} · {h.header.odometer} km</div></div><div style={{textAlign:"right"}}><span className={`pr-badge ${badgeClass(statusColor(hCls.overallStatus))}`}>{SC[hCls.overallStatus].label}</span><div style={{fontSize:"9pt",fontWeight:800,marginTop:"2px",color:hScore>=80?"#15803d":hScore>=50?"#b45309":"#b91c1c"}}>{hScore}/100</div></div></div>
          {hFails.length>0&&<div style={{marginTop:"4px"}}><div style={{fontSize:"8pt",fontWeight:700,color:"#b91c1c",marginBottom:"2px"}}>Critical ({hFails.length}):</div>{hFails.map(item=>{const r=h.itemResults[item.code];return(<div key={item.code} style={{fontSize:"8pt",color:"#374151",paddingLeft:"8px"}}>• {item.label}{r.defectCode?` — ${DEFECT_CODES[r.defectCode]}`:""}{r.measuredValue!==undefined&&r.measuredValue!==""?` [${r.measuredValue}${item.unit}]`:""}</div>);})}</div>}
          {hMons.length>0&&<div style={{marginTop:"3px"}}><div style={{fontSize:"8pt",fontWeight:700,color:"#b45309",marginBottom:"2px"}}>Monitored ({hMons.length}):</div>{hMons.map(item=>{const r=h.itemResults[item.code];return(<div key={item.code} style={{fontSize:"8pt",color:"#374151",paddingLeft:"8px"}}>• {item.label}{r.defectCode?` — ${DEFECT_CODES[r.defectCode]}`:""}{r.measuredValue!==undefined&&r.measuredValue!==""?` [${r.measuredValue}${item.unit}]`:""}</div>);})}</div>}
          {hReps.length>0&&<div style={{marginTop:"3px"}}><div style={{fontSize:"8pt",fontWeight:700,color:"#1d4ed8",marginBottom:"2px"}}>Replaced ({hReps.length}):</div>{hReps.map(item=>{const r=h.itemResults[item.code];return(<div key={item.code} style={{fontSize:"8pt",color:"#374151",paddingLeft:"8px"}}>• {item.label}{r.partReplaced?` — ${r.partQty>1?r.partQty+"× ":""}${r.partReplaced}`:""}{r.measuredValue&&r.afterMeasure?` [${r.measuredValue}→${r.afterMeasure}${item.unit}]`:""}</div>);})}</div>}
          {hasPms&&<div style={{marginTop:"3px"}}><div style={{fontSize:"8pt",fontWeight:700,color:"#15803d",marginBottom:"2px"}}>Services:</div>{PMS_ITEMS.filter(item=>h.pmsData.items?.[item.code]).map(item=>(<div key={item.code} style={{fontSize:"8pt",color:"#374151",paddingLeft:"8px"}}>• {item.label}{h.pmsData.serviceDetails?.[item.code]?.brand?` — ${h.pmsData.serviceDetails[item.code].brand}`:""}</div>))}{h.pmsData.ecuData?.performed&&<div style={{fontSize:"8pt",color:"#374151",paddingLeft:"8px"}}>• ECU Scan{h.pmsData.ecuData.codes?.length>0?` — ${h.pmsData.ecuData.codes.map(c=>c.code).join(", ")}`:" — No DTCs"}</div>}</div>}
          {h.pmsData?.laborTypes?.length>0&&<div style={{marginTop:"3px"}}><div style={{fontSize:"8pt",fontWeight:700,color:"#374151",marginBottom:"2px"}}>Labor Performed:</div>{h.pmsData.laborTypes.map(lt=>(<div key={lt.code} style={{fontSize:"8pt",color:"#374151",paddingLeft:"8px"}}>• {lt.label}</div>))}{h.pmsData.otherLabor&&<div style={{fontSize:"8pt",color:"#6b7280",paddingLeft:"8px",fontStyle:"italic"}}>"{h.pmsData.otherLabor}"</div>}</div>}
          {h.supervisorCleared&&<div style={{marginTop:"3px",fontSize:"8pt",color:"#1d4ed8"}}>Supervisor override by {h.supervisorName}{h.supervisorRemarks?`: "${h.supervisorRemarks}"`:""}</div>}
        </div>);})}
      </div>

      {/* ── FOOTER ── */}
      <div className="pr-footer"><div className="pr-footer-brand">MG Fleet Management System (FMS)</div><div>A Subsidiary of Master Garage Philippines · Est. 2019</div><div style={{marginTop:"4px"}}>Generated: {new Date().toLocaleString("en-PH")} · fleet.mastergarage.ph</div></div>
    </div>
  );
}

function Report({a,allAssessments,pmsRecords,onClose}){
  const[viewPhoto,setViewPhoto]=useState(null);
  const cls=a.classification;const cfg=SC[cls.overallStatus];
  const fails=ALL_ITEMS.filter(i=>a.itemResults[i.code]?.resultCode==="fail_critical");
  const mons=ALL_ITEMS.filter(i=>a.itemResults[i.code]?.resultCode==="monitor");
  return(
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Assessment Report" sub={a.rwaNumber} onBack={onClose}/>
      <div className="px-4 pt-4 pb-28 space-y-4">
        <div className={`bg-gradient-to-br ${cfg.grad} text-white rounded-2xl p-5`}><div className="text-xs font-bold tracking-widest opacity-60 mb-1">MG FLEET MANAGEMENT SYSTEM (FMS)</div><div className="text-2xl font-black">{cfg.label}</div><div className="text-white/60 text-sm mb-3">{a.rwaNumber} · {a.header.date}</div><div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm ${cls.dispatchAllowed?"bg-green-500":"bg-black/30"}`}>{cls.dispatchAllowed?"✓ Dispatch Allowed":"⛔ Do NOT Dispatch — Unit on Hold"}</div>{cls.reassessmentDue&&<div className="mt-2 text-xs opacity-70">{cls.overallStatus==="deferred"?`⏰ Reassessment required by ${cls.reassessmentDue}`:`📅 Next check by ${cls.reassessmentDue}`}</div>}</div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Vehicle & Inspection</div><div className="grid grid-cols-2 gap-x-4 gap-y-2.5">{[["Plate",a.header.plate],["Vehicle",[a.header.make,a.header.model,a.header.yearModel?`(${a.header.yearModel})`:null].filter(Boolean).join(" ")||"—"],["Client",a.header.client],["Branch",a.header.branch],["Technician",a.header.technician],["Odometer",a.header.odometer+" km"],["Type",a.header.type],["Date",a.header.date],["Submitted",new Date(a.submittedAt).toLocaleString("en-PH")]].map(([k,v])=>(<div key={k}><div className="text-xs text-gray-400">{k}</div><div className="text-sm font-bold text-gray-800 leading-snug">{v}</div></div>))}</div></div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Classification Summary</div><div className="space-y-2">{[{label:"Technical Status",value:cls.technicalStatus.toUpperCase(),color:SC[cls.technicalStatus]?.badge},{label:"Compliance",value:cls.complianceStatus==="compliant"?"COMPLIANT":"NON-COMPLIANT",color:cls.complianceStatus==="compliant"?"bg-green-100 text-green-800":"bg-red-100 text-red-800"},{label:"Dispatch Allowed",value:cls.dispatchAllowed?"YES":"NO",color:cls.dispatchAllowed?"bg-green-100 text-green-800":"bg-red-100 text-red-800"},{label:"Critical Items",value:String(cls.failCriticalCount||0),color:cls.failCriticalCount>0?"bg-red-100 text-red-800":"bg-gray-100 text-gray-600"},{label:"Dispatch Blockers",value:String(cls.totalBlockerCount||0),color:cls.totalBlockerCount>0?"bg-red-100 text-red-800":"bg-gray-100 text-gray-600"},{label:"Reassessment Due",value:cls.reassessmentDue||"None",color:cls.reassessmentDue?"bg-orange-100 text-orange-800":"bg-gray-100 text-gray-600"}].map(r=>(<div key={r.label} className="flex items-center justify-between"><span className="text-sm text-gray-500">{r.label}</span><Badge label={r.value} color={r.color}/></div>))}</div></div>
        {fails.length>0&&(<div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4"><div className="font-black text-red-700 mb-3 text-sm">🚨 Critical Findings ({fails.length})</div>{fails.map(item=>{const r=a.itemResults[item.code];const ac=ACTION_CFG[getAction(item,r.resultCode)];return(<div key={item.code} className="bg-white rounded-xl p-3 mb-2 border border-red-200"><div className="flex items-start justify-between gap-2 mb-1"><span className="font-bold text-gray-800 text-sm">{item.label}</span><span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${ac.bg} ${ac.color}`}>{ac.label}</span></div>{r.measuredValue!==undefined&&r.measuredValue!==""&&<div className="text-xs text-red-600 font-semibold">Measured: {r.measuredValue}{item.unit} — Min: {item.threshold}{item.unit}</div>}{r.defectCode&&<div className="text-xs text-gray-500 mt-0.5">Defect: {DEFECT_CODES[r.defectCode]}</div>}{r.note&&<div className="text-xs text-gray-500 italic mt-0.5">"{r.note}"</div>}{(r.photos||[]).length>0&&<div className="flex gap-1.5 mt-2">{r.photos.map((src,i)=><img key={i} src={src} onClick={()=>setViewPhoto(src)} className="w-14 h-14 rounded-lg object-cover border border-gray-200 cursor-pointer"/>)}</div>}</div>);})}</div>)}
        {mons.length>0&&(<div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4"><div className="font-black text-amber-700 mb-3 text-sm">⚠️ Items to Monitor ({mons.length})</div>{mons.map(item=>{const r=a.itemResults[item.code];return(<div key={item.code} className="bg-white rounded-xl p-3 mb-2 border border-amber-200"><div className="font-bold text-gray-800 text-sm">{item.label}</div>{r.measuredValue!==undefined&&r.measuredValue!==""&&<div className="text-xs text-amber-600 font-semibold">Measured: {r.measuredValue}{item.unit}</div>}{r.defectCode&&<div className="text-xs text-gray-500">Defect: {DEFECT_CODES[r.defectCode]}</div>}{r.note&&<div className="text-xs text-gray-500 italic">"{r.note}"</div>}</div>);})}</div>)}
        {(()=>{const repItems=ALL_ITEMS.filter(i=>a.itemResults[i.code]?.resultCode==="replaced");if(repItems.length===0)return null;return(<div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-4"><div className="font-black text-blue-700 mb-1 text-sm">🔩 Parts Replaced On-Site ({repItems.length})</div><div className="text-xs text-blue-500 mb-3">Defects found and resolved during this inspection.</div>{repItems.map(item=>{const r=a.itemResults[item.code];return(<div key={item.code} className="bg-white rounded-xl p-3 mb-2 border border-blue-200"><div className="flex items-start justify-between gap-2 mb-1"><span className="font-bold text-gray-800 text-sm">{item.label}</span><span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">Replaced</span></div>{r.defectCode&&<div className="text-xs text-red-600 font-semibold">Defect: {DEFECT_CODES[r.defectCode]}</div>}{r.measuredValue!==undefined&&r.measuredValue!==""&&<div className="text-xs text-gray-600 mt-0.5">Before: <span className="font-bold text-red-600">{r.measuredValue}{item.unit}</span>{r.afterMeasure&&r.afterMeasure!==""&&<span> → After: <span className={`font-bold ${parseFloat(r.afterMeasure)>=item.threshold?"text-green-600":"text-amber-600"}`}>{r.afterMeasure}{item.unit}</span></span>}</div>}{r.partReplaced&&<div className="mt-1.5 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1"><span className="text-xs font-black text-blue-700">{r.partQty&&r.partQty>1?`${r.partQty}× `:""}{r.partReplaced}</span></div>}{r.note&&<div className="text-xs text-gray-500 italic mt-1">"{r.note}"</div>}{(r.photos||[]).length>0&&<div className="flex gap-1.5 mt-2 flex-wrap">{r.photos.map((src,i)=><img key={i} src={src} onClick={()=>setViewPhoto(src)} className="w-14 h-14 rounded-lg object-cover border border-gray-200 cursor-pointer"/>)}</div>}</div>);})}</div>);})()}
        <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Full Checklist ({ALL_ITEMS.length} items)</div>{CATEGORIES.map(cat=>(<div key={cat.code} className="mb-4"><div className="text-xs font-bold text-gray-600 mb-2">{cat.icon} {cat.label}</div>{cat.items.map(item=>{const r=a.itemResults[item.code];const code=r?.resultCode;return(<div key={item.code} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${code?`${RC[code].bg} text-white`:"bg-gray-200 text-gray-400"}`}>{code?RC[code].icon:"?"}</span><span className="text-xs text-gray-700 flex-1">{item.label}</span>{r?.measuredValue!==undefined&&r?.measuredValue!==""&&<span className="text-xs text-gray-500 font-mono">{r.measuredValue}{item.unit}{code==="replaced"&&r?.afterMeasure&&r.afterMeasure!==""&&<span className="text-green-600">→{r.afterMeasure}{item.unit}</span>}</span>}{code==="replaced"&&r?.partReplaced&&<span className="text-xs text-blue-600 font-semibold truncate max-w-24">{r.partReplaced}</span>}{(r?.photos||[]).length>0&&<span className="text-xs text-blue-500">📷{r.photos.length}</span>}</div>);})}</div>))}</div>
        <div className="bg-gray-800 rounded-2xl p-4 text-center"><div className="text-white text-xs font-bold">MG Fleet Management System (FMS)</div><div className="text-gray-400 text-xs">A Subsidiary of Master Garage Philippines · Est. 2019</div><div className="text-gray-500 text-xs mt-2">Generated: {new Date().toLocaleString("en-PH")}</div><div className="text-gray-500 text-xs">fleet.mastergarage.ph · (02) 888-8823</div></div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2"><button onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 rounded-2xl py-3.5 font-black active:scale-95">← Back</button><button onClick={()=>window.print()} className="flex-1 bg-red-700 text-white rounded-2xl py-3.5 font-black active:scale-95">📄 Full Report (PDF)</button></div>
      {createPortal(<div id="print-report-portal" style={{position:"fixed",top:0,left:0,width:0,height:0,overflow:"hidden",opacity:0,pointerEvents:"none"}}><PrintableReport a={a} allAssessments={allAssessments||[]} pmsRecords={pmsRecords||{}}/></div>,document.body)}
      <PhotoLightbox src={viewPhoto} onClose={()=>setViewPhoto(null)}/>
    </div>
  );
}

const CHART_COLORS={active:"#16a34a",conditional:"#d97706",deferred:"#b91c1c"};
const ChartCard=({title,children})=>(<div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{title}</div>{children}</div>);
const DonutLabel=({viewBox,total})=>{const{cx,cy}=viewBox;return(<text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"><tspan x={cx} dy="-6" fontSize="22" fontWeight="900" fill="#1f2937">{total}</tspan><tspan x={cx} dy="18" fontSize="10" fill="#9ca3af">Total</tspan></text>);};

function Analytics({assessments:allAssessments,onBack,bottomNav}){
  const[tab,setTab]=useState("overview");
  const assessments=allAssessments.filter(a=>!a.resolvedByRwa);
  const counts={active:0,conditional:0,deferred:0,total:assessments.length};assessments.forEach(a=>counts[a.classification.overallStatus]++);
  const byBranch={};BRANCHES.forEach(b=>byBranch[b]={active:0,conditional:0,deferred:0,total:0});assessments.forEach(a=>{const b=a.header.branch;if(!byBranch[b])byBranch[b]={active:0,conditional:0,deferred:0,total:0};byBranch[b][a.classification.overallStatus]++;byBranch[b].total++;});
  const byClient={};assessments.forEach(a=>{const c=a.header.client;if(!byClient[c])byClient[c]={active:0,conditional:0,deferred:0,total:0};byClient[c][a.classification.overallStatus]++;byClient[c].total++;});
  const defectTally={};assessments.forEach(a=>Object.values(a.itemResults).forEach(r=>{if(r.defectCode)defectTally[r.defectCode]=(defectTally[r.defectCode]||0)+1;}));
  const topDefects=Object.entries(defectTally).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const deferred=assessments.filter(a=>a.classification.overallStatus==="deferred");
  const queue=assessments.filter(a=>a.classification.reassessmentRequired&&a.classification.reassessmentDue).sort((a,b)=>new Date(a.classification.reassessmentDue)-new Date(b.classification.reassessmentDue));

  // Donut data
  const donutData=[{name:"Active",value:counts.active,color:CHART_COLORS.active},{name:"Conditional",value:counts.conditional,color:CHART_COLORS.conditional},{name:"Deferred",value:counts.deferred,color:CHART_COLORS.deferred}].filter(d=>d.value>0);

  // Monthly volume (last 6 months)
  const monthlyData=(()=>{const months=[];const now=new Date();for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("en-PH",{month:"short",year:"2-digit"}),active:0,conditional:0,deferred:0,total:0});}assessments.forEach(a=>{const m=a.submittedAt?.slice(0,7);const bucket=months.find(b=>b.key===m);if(bucket){bucket[a.classification.overallStatus]++;bucket.total++;}});return months;})();

  // Top defects chart data
  const defectChartData=topDefects.map(([code,count])=>({name:DEFECT_CODES[code]?.length>18?DEFECT_CODES[code].slice(0,18)+"…":DEFECT_CODES[code],full:DEFECT_CODES[code],count}));

  // Branch chart data
  const branchChartData=Object.entries(byBranch).filter(([,v])=>v.total>0).map(([name,data])=>({name:name.replace("MG",""),active:data.active,conditional:data.conditional,deferred:data.deferred,total:data.total,deferredRate:data.total>0?Math.round(data.deferred/data.total*100):0}));

  // Client chart data
  const clientChartData=Object.entries(byClient).map(([name,data])=>({name:name.length>25?name.slice(0,25)+"…":name,full:name,active:data.active,conditional:data.conditional,deferred:data.deferred,total:data.total}));

  const CustomTooltip=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-xs shadow-lg">{label&&<div className="font-bold mb-1">{payload[0]?.payload?.full||label}</div>}{payload.map((p,i)=>(<div key={i} className="flex items-center gap-2"><span style={{background:p.color||p.fill,width:8,height:8,borderRadius:4,display:"inline-block"}}/><span>{p.name}: <strong>{p.value}</strong></span></div>))}</div>);};

  return(
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Fleet Analytics" sub={`${counts.total} total assessments`} onBack={onBack}/>
      <div className="bg-white border-b border-gray-200 px-4 flex gap-0 overflow-x-auto">{[["overview","Overview"],["branch","Branch"],["client","Client"],["queue","Queue"]].map(([k,l])=>(<button key={k} onClick={()=>setTab(k)} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${tab===k?"border-red-700 text-red-700":"border-transparent text-gray-400 hover:text-gray-600"}`}>{l}</button>))}</div>
      <div className="px-4 pt-4 pb-8 space-y-4">
        {tab==="overview"&&<>
          {counts.total>0&&<ChartCard title="Fleet Health Distribution">
            <div style={{width:"100%",height:220}}><ResponsiveContainer>
              <PieChart><Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} label={({name,value})=>`${name} ${Math.round(value/counts.total*100)}%`} labelLine={false} style={{fontSize:10,fontWeight:700}}>{donutData.map((d,i)=>(<Cell key={i} fill={d.color}/>))}</Pie><Tooltip content={<CustomTooltip/>}/></PieChart>
            </ResponsiveContainer></div>
            <div className="flex justify-center gap-4 mt-2">{[["Active",CHART_COLORS.active,counts.active],["Conditional",CHART_COLORS.conditional,counts.conditional],["Deferred",CHART_COLORS.deferred,counts.deferred]].map(([l,c,v])=>(<div key={l} className="flex items-center gap-1.5"><span style={{background:c,width:10,height:10,borderRadius:5,display:"inline-block"}}/><span className="text-xs text-gray-600 font-semibold">{l}: {v}</span></div>))}</div>
          </ChartCard>}
          <ChartCard title="Monthly Assessment Volume">
            <div style={{width:"100%",height:200}}><ResponsiveContainer>
              <BarChart data={monthlyData} margin={{top:5,right:5,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="label" tick={{fontSize:10}} stroke="#9ca3af"/><YAxis tick={{fontSize:10}} stroke="#9ca3af" allowDecimals={false}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="active" name="Active" fill={CHART_COLORS.active} radius={[3,3,0,0]} stackId="s"/><Bar dataKey="conditional" name="Conditional" fill={CHART_COLORS.conditional} radius={[0,0,0,0]} stackId="s"/><Bar dataKey="deferred" name="Deferred" fill={CHART_COLORS.deferred} radius={[3,3,0,0]} stackId="s"/></BarChart>
            </ResponsiveContainer></div>
          </ChartCard>
          {defectChartData.length>0&&<ChartCard title="Top Defects">
            <div style={{width:"100%",height:Math.max(160,defectChartData.length*32)}}><ResponsiveContainer>
              <BarChart data={defectChartData} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/><XAxis type="number" tick={{fontSize:10}} stroke="#9ca3af" allowDecimals={false}/><YAxis type="category" dataKey="name" tick={{fontSize:9}} stroke="#9ca3af" width={110}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="count" name="Occurrences" fill="#b91c1c" radius={[0,4,4,0]}/></BarChart>
            </ResponsiveContainer></div>
          </ChartCard>}
          <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Dispatch & Compliance</div>{[{label:"Cleared for Dispatch",count:assessments.filter(a=>a.classification.dispatchAllowed).length,color:"bg-green-100 text-green-800"},{label:"On Hold — Do Not Dispatch",count:assessments.filter(a=>!a.classification.dispatchAllowed).length,color:"bg-red-100 text-red-800"},{label:"Reassessment Required",count:assessments.filter(a=>a.classification.reassessmentRequired).length,color:"bg-orange-100 text-orange-800"},{label:"Non-Compliant (LTO)",count:assessments.filter(a=>a.classification.complianceStatus==="non_compliant").length,color:"bg-blue-100 text-blue-800"}].map(r=>(<div key={r.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-600">{r.label}</span><Badge label={String(r.count)} color={r.color}/></div>))}</div>
          {counts.total===0&&<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📊</div><div>No data yet</div></div>}
        </>}
        {tab==="branch"&&(<div className="space-y-4">
          {branchChartData.length>0&&<ChartCard title="Branch Performance">
            <div style={{width:"100%",height:220}}><ResponsiveContainer>
              <BarChart data={branchChartData} margin={{top:5,right:5,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="name" tick={{fontSize:9}} stroke="#9ca3af"/><YAxis tick={{fontSize:10}} stroke="#9ca3af" allowDecimals={false}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="active" name="Active" fill={CHART_COLORS.active} radius={[3,3,0,0]} stackId="s"/><Bar dataKey="conditional" name="Conditional" fill={CHART_COLORS.conditional} stackId="s"/><Bar dataKey="deferred" name="Deferred" fill={CHART_COLORS.deferred} radius={[3,3,0,0]} stackId="s"/></BarChart>
            </ResponsiveContainer></div>
            <div className="flex justify-center gap-4 mt-2">{[["Active",CHART_COLORS.active],["Conditional",CHART_COLORS.conditional],["Deferred",CHART_COLORS.deferred]].map(([l,c])=>(<div key={l} className="flex items-center gap-1.5"><span style={{background:c,width:10,height:10,borderRadius:5,display:"inline-block"}}/><span className="text-xs text-gray-600 font-semibold">{l}</span></div>))}</div>
          </ChartCard>}
          <ChartCard title="Deferred Rate by Branch">
            <div className="space-y-2">{branchChartData.map(b=>(<div key={b.name}><div className="flex items-center justify-between mb-1"><span className="text-sm font-bold text-gray-700">{b.name}</span><span className="text-xs font-bold" style={{color:b.deferredRate>30?"#b91c1c":b.deferredRate>10?"#d97706":"#16a34a"}}>{b.deferredRate}% deferred</span></div><div className="bg-gray-100 rounded-full h-3 overflow-hidden flex">{b.active>0&&<div style={{width:`${b.active/b.total*100}%`,background:CHART_COLORS.active}} className="h-full"/>}{b.conditional>0&&<div style={{width:`${b.conditional/b.total*100}%`,background:CHART_COLORS.conditional}} className="h-full"/>}{b.deferred>0&&<div style={{width:`${b.deferred/b.total*100}%`,background:CHART_COLORS.deferred}} className="h-full"/>}</div><div className="text-xs text-gray-400 mt-0.5">{b.total} assessment{b.total!==1?"s":""}</div></div>))}</div>
          </ChartCard>
          <div className="space-y-3">{Object.entries(byBranch).filter(([,v])=>v.total>0).map(([branch,data])=>(<div key={branch} className="bg-white rounded-2xl border border-gray-200 p-4"><div className="font-bold text-gray-800 mb-3">{branch}</div><div className="flex gap-2 mb-1">{[["active","Active","bg-green-50 text-green-700"],["conditional","Conditional","bg-amber-50 text-amber-700"],["deferred","Deferred","bg-red-50 text-red-700"]].map(([k,l,c])=>(<div key={k} className={`flex-1 ${c} rounded-xl p-2 text-center`}><div className="text-2xl font-black">{data[k]}</div><div className="text-xs">{l}</div></div>))}</div><div className="text-xs text-gray-400 text-right mt-1">{data.total} total</div></div>))}</div>
        </div>)}
        {tab==="client"&&(<div className="space-y-4">
          {clientChartData.length>0&&<ChartCard title="Client Fleet Status">
            <div style={{width:"100%",height:Math.max(180,clientChartData.length*50)}}><ResponsiveContainer>
              <BarChart data={clientChartData} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/><XAxis type="number" tick={{fontSize:10}} stroke="#9ca3af" allowDecimals={false}/><YAxis type="category" dataKey="name" tick={{fontSize:9}} stroke="#9ca3af" width={120}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="active" name="Active" fill={CHART_COLORS.active} stackId="s" radius={[0,0,0,0]}/><Bar dataKey="conditional" name="Conditional" fill={CHART_COLORS.conditional} stackId="s"/><Bar dataKey="deferred" name="Deferred" fill={CHART_COLORS.deferred} stackId="s" radius={[0,4,4,0]}/></BarChart>
            </ResponsiveContainer></div>
            <div className="flex justify-center gap-4 mt-2">{[["Active",CHART_COLORS.active],["Conditional",CHART_COLORS.conditional],["Deferred",CHART_COLORS.deferred]].map(([l,c])=>(<div key={l} className="flex items-center gap-1.5"><span style={{background:c,width:10,height:10,borderRadius:5,display:"inline-block"}}/><span className="text-xs text-gray-600 font-semibold">{l}</span></div>))}</div>
          </ChartCard>}
          <div className="space-y-3">{Object.entries(byClient).map(([client,data])=>(<div key={client} className="bg-white rounded-2xl border border-gray-200 p-4"><div className="font-bold text-gray-800 text-sm mb-3 leading-snug">{client}</div><div className="flex gap-2">{[["active","Active","bg-green-50 text-green-700"],["conditional","Conditional","bg-amber-50 text-amber-700"],["deferred","Deferred","bg-red-50 text-red-700"]].map(([k,l,c])=>(<div key={k} className={`flex-1 ${c} rounded-xl p-2 text-center`}><div className="text-2xl font-black">{data[k]}</div><div className="text-xs">{l}</div></div>))}</div><div className="text-xs text-gray-400 text-right mt-1">{data.total} total</div></div>))}</div>
        </div>)}
        {tab==="queue"&&<><div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Reassessment Queue</div><div className="text-xs text-gray-400 mb-3">Sorted by urgency — nearest due date first</div>{queue.length===0?<div className="text-center py-6 text-gray-400 text-sm">No pending reassessments ✓</div>:queue.map(a=>{const d=Math.ceil((new Date(a.classification.reassessmentDue)-new Date())/86400000);const urg=d<=1?"bg-red-100 text-red-800":d<=3?"bg-orange-100 text-orange-800":"bg-amber-100 text-amber-800";return(<div key={a.id} className="py-3 border-b border-gray-100 last:border-0"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-gray-800">{a.header.plate}</div><div className="text-xs text-gray-400">{a.header.branch} · {a.header.client}</div></div><div className="text-right shrink-0"><Badge label={SC[a.classification.overallStatus].label} color={SC[a.classification.overallStatus].badge}/><div className={`text-xs font-bold mt-1.5 px-2 py-0.5 rounded-full ${urg}`}>Due in {d}d</div></div></div></div>);})}</div><div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Deferred Units</div>{deferred.length===0?<div className="text-center py-6 text-green-600 font-bold text-sm">✓ No deferred units</div>:deferred.map(a=>(<div key={a.id} className="py-3 border-b border-gray-100 last:border-0"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-gray-800">{a.header.plate}</div><div className="text-xs text-gray-400">{a.header.client} · {a.header.branch}</div><div className="text-xs text-red-500 font-semibold">{a.classification.failCriticalCount} critical item(s)</div></div><div className="text-right shrink-0"><span className="text-xs font-bold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">⛔ HOLD</span>{a.classification.reassessmentDue&&<div className="text-xs text-gray-400 mt-1">By {a.classification.reassessmentDue}</div>}</div></div></div>))}</div></>}
      </div>
      {bottomNav}
    </div>
  );
}

export default function AppWithErrorBoundary(){return(<ErrorBoundary><App/></ErrorBoundary>);}

// Session restore — survives accidental refresh but not new tabs
function loadSession(){try{const raw=sessionStorage.getItem("fms:session:v1");if(raw)return JSON.parse(raw);}catch(_){}return null;}
function saveSession(data){try{sessionStorage.setItem("fms:session:v1",JSON.stringify(data));}catch(_){}}
function clearSession(){try{sessionStorage.removeItem("fms:session:v1");sessionStorage.removeItem("fms:draft:pms:v1");sessionStorage.removeItem("fms:draft:quickfix:v1");}catch(_){}}

function App(){
  const ss=useRef(loadSession()).current;
  const[user,setUser]=useState(null);const[authLoad,setAuthLoad]=useState(true);const[loginErr,setLoginErr]=useState('');const[email,setEmail]=useState('');const[pass,setPass]=useState('');
  const[userRole,setUserRole]=useState(null);const[userProfile,setUserProfile]=useState(null);
  const[screen,setScreen]=useState(ss?.screen||"dashboard");const[assessments,setAssessments]=useState([]);const[pmsRecords,setPmsRecords]=useState({});const[mechanic,setMechanic]=useState({name:"",branch:""});const[loading,setLoading]=useState(true);const[loadError,setLoadError]=useState(null);const[connStatus,setConnStatus]=useState("connected");const[retryKey,setRetryKey]=useState(0);const[vehicleRegistry,setVehicleRegistry]=useState({});
  const[header,setHeader]=useState(ss?.header||{plate:"",make:"",model:"",yearModel:"",client:"",branch:"",technician:"",type:"Initial",odometer:"",date:new Date().toISOString().slice(0,10)});
  const[itemResults,setItemResults]=useState(ss?.itemResults||{});const[expandedCat,setExpandedCat]=useState(ss?.expandedCat||"ENG");const[currentA,setCurrentA]=useState(ss?.currentA||null);
  const[showReport,setShowReport]=useState(false);const[showSupervisor,setShowSupervisor]=useState(false);const[vehiclePlate,setVehiclePlate]=useState(ss?.vehiclePlate||null);
  const[filterStatus,setFilterStatus]=useState(ss?.filterStatus||"all");const[filterBranch,setFilterBranch]=useState(ss?.filterBranch||"all");const[searchPlate,setSearchPlate]=useState("");
  const[copied,setCopied]=useState(false);const[reAssessFrom,setReAssessFrom]=useState(ss?.reAssessFrom||null);const[reassessMode,setReassessMode]=useState(ss?.reassessMode||null);const[plateSearch,setPlateSearch]=useState("");const[viewPhoto,setViewPhoto]=useState(null);
  const[errorLogs,setErrorLogs]=useState([]);const[errorLogsLoaded,setErrorLogsLoaded]=useState(false);const[errorLogsCopied,setErrorLogsCopied]=useState(false);
  // Persist session state on changes
  useEffect(()=>{if(screen==="dashboard"||screen==="history"||screen==="analytics"||screen==="settings"||screen==="users"){clearSession();return;}saveSession({screen,header,itemResults,expandedCat,currentA,vehiclePlate,reAssessFrom,reassessMode,filterStatus,filterBranch});},[screen,header,itemResults,expandedCat,currentA,vehiclePlate,reAssessFrom,reassessMode,filterStatus,filterBranch]);

  useEffect(()=>{return onAuth(u=>{setUser(u);setAuthLoad(false);});},[]);
  useEffect(()=>{
    // Wait for auth to fully resolve before touching Firestore
    if(authLoad||!user){setLoading(false);setUserRole(null);setUserProfile(null);return;}
    setLoadError(null);setLoading(true);setConnStatus("connected");
    const mechR=localStorage.getItem("fms:mechanic:v1");if(mechR){try{setMechanic(JSON.parse(mechR));}catch(_){}}
    let savedReg={};try{const regR=localStorage.getItem("fms:vehicleRegistry:v1");if(regR)savedReg=JSON.parse(regR);}catch(_){}
    let gotFirstAssess=false,gotFirstPMS=false,gotProfile=false;
    let unsubAssess=null,unsubPMS=null,cancelled=false;
    const checkReady=()=>{if(gotFirstAssess&&gotFirstPMS&&gotProfile)setLoading(false);};
    const handleListenerError=(e)=>{
      logError("firestoreListener",e);
      if(!gotFirstAssess||!gotFirstPMS){setLoadError(e.message||"Failed to connect to server");setLoading(false);}
      else{setConnStatus("reconnecting");}
    };
    // Force auth token to be ready, THEN attach Firestore listeners
    waitForAuthToken(user).then(async()=>{
      if(cancelled)return;
      // Fetch user role
      try{
        const profile=await getUserProfile(user.uid);
        if(profile){
          // Bootstrap: promote edejercito@gmail.com to fleet_manager if still technician
          if(user.email==="edejercito@gmail.com"&&(!profile.role||profile.role==="technician")){
            await saveUserProfile(user.uid,{role:"fleet_manager"});
            profile.role="fleet_manager";
          }
          setUserRole(profile.role||"technician");setUserProfile(profile);if(profile.name&&profile.branch)setMechanic({name:profile.name,branch:profile.branch});
        }else{
          // First login — check if any users exist; first user ever becomes fleet_manager
          const allExisting=await getAllUsers();
          const isFirst=allExisting.length===0;
          const defaultRole=isFirst||user.email==="edejercito@gmail.com"?"fleet_manager":"technician";
          const defaultProfile={role:defaultRole,name:"",branch:"",email:user.email,createdAt:new Date().toISOString()};
          await saveUserProfile(user.uid,defaultProfile);
          setUserRole(defaultRole);setUserProfile({uid:user.uid,...defaultProfile});
        }
      }catch(e){logError("getUserProfile",e);setUserRole("technician");setUserProfile({uid:user.uid,role:"technician",name:"",branch:"",email:user.email});}
      gotProfile=true;checkReady();
      unsubAssess=onAssessmentsSnapshot(data=>{
        setAssessments(data);setConnStatus("connected");
        let sr={};try{const r=localStorage.getItem("fms:vehicleRegistry:v1");if(r)sr=JSON.parse(r);}catch(_){}
        setVehicleRegistry(buildVehicleRegistry(data,sr));
        if(!gotFirstAssess){gotFirstAssess=true;checkReady();}
      },handleListenerError);
      unsubPMS=onPMSRecordsSnapshot(data=>{
        setPmsRecords(data);setConnStatus("connected");
        if(!gotFirstPMS){gotFirstPMS=true;checkReady();}
      },handleListenerError);
    }).catch(e=>{
      if(!cancelled){logError("authToken",e);setLoadError("Authentication failed. Please log out and log in again.");setLoading(false);}
    });
    return()=>{cancelled=true;if(unsubAssess)unsubAssess();if(unsubPMS)unsubPMS();};
  },[authLoad,user,retryKey]);
  // One-time migration: fix deferred assessments that have a newer non-deferred re-assessment
  const migratedRef=useRef(false);
  const submittingRef=useRef(false);
  useEffect(()=>{
    if(migratedRef.current||assessments.length===0)return;
    migratedRef.current=true;
    const byPlate={};assessments.forEach(a=>{const p=a.header.plate;if(!byPlate[p])byPlate[p]=[];byPlate[p].push(a);});
    Object.values(byPlate).forEach(plateDocs=>{
      plateDocs.sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));
      const latestNonDeferred=plateDocs.find(a=>a.classification.overallStatus!=="deferred");
      if(!latestNonDeferred)return;
      const staleDeferred=plateDocs.filter(a=>a.classification.overallStatus==="deferred"&&!a.resolvedByRwa&&new Date(a.submittedAt)<new Date(latestNonDeferred.submittedAt));
      staleDeferred.forEach(async(old)=>{
        if(!old._docId)return;
        try{await updateAssessment(old._docId,{resolvedByRwa:latestNonDeferred.rwaNumber,resolvedAt:new Date().toISOString()});}catch(e){logError("migrationFix",e,{plate:old.header.plate,rwa:old.rwaNumber});}
      });
    });
  },[assessments]);
  useEffect(()=>{if(screen==="new"){const v=vehicleRegistry[header.plate];if(v){setHeader(prev=>({...prev,make:v.make||prev.make,model:v.model||prev.model,yearModel:v.yearModel||prev.yearModel,client:v.client||prev.client}));}}},[header.plate,screen,vehicleRegistry]);

  // Pre-fill non-active items when entering inspect screen
  const prefilledRef=useRef(null);
  useEffect(()=>{if(screen!=="inspect")return;const key=header.type+"-"+(reAssessFrom?.id||"");if(prefilledRef.current===key)return;prefilledRef.current=key;if(header.type==="Pre-Dispatch"){const prefilled={...itemResults};ALL_ITEMS.forEach(i=>{if(!PRE_DISPATCH_ITEMS.has(i.code)&&!prefilled[i.code]?.resultCode)prefilled[i.code]={resultCode:"na"};});setItemResults(prefilled);}},[screen,header.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeItemSet=getActiveItems(header.type,reAssessFrom);
  const activeCats=getActiveCategories(activeItemSet);
  const activeItemsList=activeItemSet?ALL_ITEMS.filter(i=>activeItemSet.has(i.code)):ALL_ITEMS;
  const answered=activeItemsList.filter(i=>itemResults[i.code]?.resultCode).length;const total=activeItemsList.length;const pct=Math.round(answered/total*100);const liveEng=answered>0?runEngine(itemResults):null;

  const persistPMS=async(records)=>{try{for(const[plate,data]of Object.entries(records)){await savePMSRecord(plate,data);}}catch(e){logError("persistPMS",e);}};
  const persistMechanic=async(m)=>{try{localStorage.setItem("fms:mechanic:v1",JSON.stringify(m));}catch(e){logError("persistMechanic",e);}};
  const handleLogin=async()=>{setLoginErr('');try{await login(email,pass);}catch(e){setLoginErr('Invalid email or password. Please try again.');}};
  const startNew=()=>{setHeader({plate:"",make:"",model:"",yearModel:"",client:"",branch:mechanic.branch||"",technician:mechanic.name||"",type:"Initial",odometer:"",date:new Date().toISOString().slice(0,10)});setItemResults({});setExpandedCat("ENG");setReAssessFrom(null);setScreen("new");};
  const startReassess=(prevA)=>{const v=vehicleRegistry[prevA.header.plate]||{};setHeader({plate:prevA.header.plate,make:v.make||prevA.header.make||"",model:v.model||prevA.header.model||"",yearModel:v.yearModel||prevA.header.yearModel||"",client:prevA.header.client,branch:mechanic.branch||prevA.header.branch,technician:mechanic.name||prevA.header.technician,type:"Re-Assessment",odometer:"",date:new Date().toISOString().slice(0,10)});const prefilled={};const flagged=getActiveItems("Re-Assessment",prevA);ALL_ITEMS.forEach(i=>{const r=prevA.itemResults?.[i.code];if(r&&!flagged?.has(i.code))prefilled[i.code]={...r};});setItemResults(prefilled);const firstFlaggedCat=CATEGORIES.find(c=>c.items.some(i=>flagged?.has(i.code)));setExpandedCat(firstFlaggedCat?.code||"ENG");setReAssessFrom(prevA);setReassessMode(null);setVehiclePlate(null);setScreen("reassess-mode");};
  const goToPMS=()=>{setScreen("pms");};

  const submitWithPMS=async(pmsData,itemResultsOverride)=>{
    if(submittingRef.current)return;
    submittingRef.current=true;
    try{
      const effectiveResults=itemResultsOverride||itemResults;
      const cls=runEngine(effectiveResults);
      const rwa=`RWA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const resolvedAt=new Date().toISOString();
      const outstandingDeferred=(header.type==="Re-Assessment"&&cls.overallStatus!=="deferred")?assessments.filter(x=>x.header.plate===header.plate&&x.classification.overallStatus==="deferred"&&!x.resolvedByRwa):[];
      const resolvedRwaNumbers=outstandingDeferred.map(d=>d.rwaNumber);
      const primaryResolved=resolvedRwaNumbers[0]||null;
      const a={id:Date.now(),rwaNumber:rwa,header:{...header},itemResults:{...effectiveResults},classification:cls,pmsData:pmsData||null,fmsStatus:"pending_sync",submittedAt:resolvedAt,resolvesRwa:primaryResolved,resolvesRwaList:resolvedRwaNumbers.length>1?resolvedRwaNumbers:null};
      const updated=[a,...assessments].map(existing=>{if(resolvedRwaNumbers.includes(existing.rwaNumber)){return{...existing,resolvedByRwa:rwa,resolvedAt};}return existing;});
      setAssessments(updated);
      const newReg={...vehicleRegistry,[header.plate]:{make:header.make,model:header.model,yearModel:header.yearModel,client:header.client,lastOdo:Math.max(parseInt(header.odometer)||0,vehicleRegistry[header.plate]?.lastOdo||0)}};setVehicleRegistry(newReg);try{localStorage.setItem("fms:vehicleRegistry:v1",JSON.stringify(newReg));}catch(_){}
      for(const d of outstandingDeferred){if(d._docId){try{await updateAssessment(d._docId,{resolvedByRwa:rwa,resolvedAt});}catch(e){logError("resolveDeferred",e,{plate:d.header.plate,rwa:d.rwaNumber});}}}
      try{const toSave=trimPhotosToFit({...a,fmsStatus:"synced"});await saveAssessment(toSave);a.fmsStatus="synced";}catch(e){logError("saveAssessment",e,{plate:header.plate});}
      if(pmsData?.updates&&Object.keys(pmsData.updates).length>0){const plate=header.plate;const updatedPMS={...pmsRecords,[plate]:{...(pmsRecords[plate]||{}),...Object.fromEntries(Object.entries(pmsData.updates).map(([code,rec])=>[code,{...rec,rwaNumber:rwa,branch:header.branch}]))}};setPmsRecords(updatedPMS);await persistPMS(updatedPMS);}
      setCurrentA(a);setReassessMode(null);try{sessionStorage.removeItem("fms:draft:pms:v1");sessionStorage.removeItem("fms:draft:quickfix:v1");}catch(_){}
      setScreen("result");
    }catch(e){logError("submitWithPMS",e,{plate:header.plate,branch:header.branch,type:header.type});}
    finally{submittingRef.current=false;}
  };

  const handleSupervisorSave=(override)=>{const updated=assessments.map(a=>{if(a.id!==currentA.id)return a;const newCls={...a.classification};if(override.reassessmentDue)newCls.reassessmentDue=override.reassessmentDue;if(override.cleared){newCls.dispatchAllowed=true;newCls.overallStatus="conditional";}return{...a,classification:newCls,supervisorRemarks:override.remarks,supervisorName:override.name,supervisorTs:override.ts,supervisorCleared:override.cleared};});const newCurrentA=updated.find(a=>a.id===currentA.id);setAssessments(updated);setCurrentA(newCurrentA);setShowSupervisor(false);};
  const handleCopyShare=async(a)=>{const txt=buildShareText(a);try{await navigator.clipboard.writeText(txt);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch(e){alert(txt);}};

  const lastOdo=vehicleRegistry[header.plate]?.lastOdo||0;const odoValid=!header.odometer||parseInt(header.odometer)>=lastOdo;
  const headerOk=header.plate&&header.make&&header.model&&header.yearModel&&header.client&&header.branch&&header.technician&&header.odometer&&odoValid;
  // Technicians see only their branch; supervisors and fleet managers see all
  const branchFiltered=userRole==="technician"&&userProfile?.branch?assessments.filter(a=>a.header.branch===userProfile.branch):assessments;
  const currentAssessments=branchFiltered.filter(a=>!a.resolvedByRwa);
  const dc={active:0,conditional:0,deferred:0};currentAssessments.forEach(a=>dc[a.classification.overallStatus]++);
  const holdCount=currentAssessments.filter(a=>!a.classification.dispatchAllowed).length;
  const reassCount=currentAssessments.filter(a=>a.classification.reassessmentRequired).length;
  const filtered=branchFiltered.filter(a=>{if(filterStatus!=="all"&&a.classification.overallStatus!==filterStatus)return false;if(filterBranch!=="all"&&a.header.branch!==filterBranch)return false;if(searchPlate&&!a.header.plate.toLowerCase().includes(searchPlate.toLowerCase()))return false;return true;});

  if(authLoad)return(<div className="min-h-screen bg-red-700 flex items-center justify-center"><div className="text-center text-white"><div className="text-5xl mb-4">🔧</div><div className="font-black text-2xl">MG Fleet FMS</div><div className="text-red-200 text-sm mt-1">Loading...</div></div></div>);
  if(!user)return(<div className="min-h-screen bg-gray-50 flex items-center justify-center px-6"><div className="w-full max-w-sm"><div className="bg-red-700 rounded-2xl p-6 mb-4 text-center"><div className="text-xs font-bold tracking-widest text-red-300 mb-1">MG FLEET MANAGEMENT SYSTEM</div><div className="text-2xl font-black text-white">Login</div><div className="text-red-200 text-sm mt-1">Master Garage Philippines</div></div><div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Email</label><input type="email" placeholder="e.g. cavite@mastergarage.ph" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"/></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Password</label><input type="password" placeholder="Enter password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"/></div>{loginErr&&<div className="text-red-600 text-xs font-semibold text-center">{loginErr}</div>}<button onClick={handleLogin} className="w-full bg-red-700 text-white rounded-2xl py-4 font-black text-lg active:scale-95 transition-all">Log In</button></div></div></div>);
  if(loading)return(<div className="min-h-screen bg-red-700 flex items-center justify-center"><div className="text-center text-white"><div className="text-5xl mb-4">🔧</div><div className="font-black text-2xl">MG Fleet FMS</div><div className="text-red-200 text-sm mt-1">Loading inspection engine...</div></div></div>);
  if(loadError)return(<div className="min-h-screen bg-gray-50 flex items-center justify-center px-5"><div className="bg-white rounded-2xl border-2 border-red-200 p-6 max-w-sm w-full"><div className="text-3xl mb-3 text-center">⚠️</div><div className="font-black text-gray-900 text-lg text-center mb-1">Connection Error</div><div className="text-gray-500 text-sm text-center mb-4">Could not load data from the server. Please check your internet connection and try again.</div><div className="bg-red-50 rounded-xl p-3 mb-5"><pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">{loadError}</pre></div><button onClick={()=>{setLoading(true);setLoadError(null);setConnStatus("connected");setRetryKey(k=>k+1);}} className="w-full bg-red-700 text-white rounded-xl py-3 font-bold text-sm mb-3 active:scale-95">🔄 Retry Connection</button><button onClick={()=>logout()} className="w-full border-2 border-gray-200 text-gray-600 rounded-xl py-3 font-bold text-sm active:scale-95">🚪 Log Out</button></div></div>);

  const ConnBanner=connStatus==="reconnecting"?(<div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 px-4 text-xs font-bold shadow-md flex items-center justify-center gap-2"><span className="animate-pulse">●</span> Reconnecting to server... Data may be outdated.</div>):null;

  if(showReport&&currentA)return <>{ConnBanner}<Report a={currentA} allAssessments={assessments} pmsRecords={pmsRecords} onClose={()=>setShowReport(false)}/></>;
  if(vehiclePlate)return(<>{ConnBanner}<VehicleProfile plate={vehiclePlate} allAssessments={assessments} pmsRecords={pmsRecords} onBack={()=>setVehiclePlate(null)} onStartReassess={startReassess} onViewAssessment={(a)=>{setCurrentA(a);setVehiclePlate(null);setScreen("result");}} onViewPhoto={setViewPhoto}/><PhotoLightbox src={viewPhoto} onClose={()=>setViewPhoto(null)}/></>);

  const navTabs=[{key:"dashboard",icon:"🏠",label:"Home"},{key:"history",icon:"📋",label:"History"},canAccess(userRole,"analytics")&&{key:"analytics",icon:"📊",label:"Analytics"},{key:"settings",icon:"⚙️",label:"Settings"},canAccess(userRole,"user_management")&&{key:"users",icon:"👥",label:"Users"}].filter(Boolean);
  const isMainScreen=navTabs.some(t=>t.key===screen);
  const BottomNav=isMainScreen?(<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"><div className="flex">{navTabs.map(tab=>(<button key={tab.key} onClick={()=>setScreen(tab.key)} className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${screen===tab.key?"text-red-700":"text-gray-400"}`}><span className="text-xl leading-none">{tab.icon}</span><span className={`text-xs font-bold ${screen===tab.key?"text-red-700":"text-gray-400"}`}>{tab.label}</span></button>))}</div></div>):null;

  if(screen==="dashboard"){
    const dateStr=new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric"});
    return(
      <div className="min-h-screen bg-gray-50">
        {ConnBanner}
        <div className="bg-red-700 text-white px-4 pt-12 pb-8"><div className="text-xs font-bold tracking-widest text-red-300 mb-0.5">MG FLEET MANAGEMENT SYSTEM (FMS)</div><div className="text-2xl font-black leading-tight">Roadworthy Assessment</div><div className="text-red-300 text-xs mt-1">{dateStr}</div></div>
        <div className="px-4 -mt-4 pb-28">
          <div className="grid grid-cols-3 gap-2.5 mb-4">{[["active","Active","bg-green-600"],["conditional","Conditional","bg-amber-500"],["deferred","Deferred","bg-red-700"]].map(([k,l,c])=>(<button key={k} onClick={()=>{setFilterStatus(k);setScreen("history");}} className={`${c} text-white rounded-2xl p-4 text-center shadow-md active:scale-95 transition-all`}><div className="text-3xl font-black">{dc[k]}</div><div className="text-xs font-semibold opacity-90 mt-0.5">{l}</div></button>))}</div>
          {(holdCount>0||reassCount>0)&&(<div className="flex gap-2 mb-4">{holdCount>0&&(<button onClick={()=>{setFilterStatus("deferred");setScreen("history");}} className="flex-1 bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl py-3 px-3 text-center active:scale-95"><div className="font-black text-xl">{holdCount}</div><div className="text-xs font-bold">⛔ On Hold</div></button>)}{reassCount>0&&(<button onClick={()=>setScreen("analytics")} className="flex-1 bg-orange-50 border-2 border-orange-300 text-orange-700 rounded-2xl py-3 px-3 text-center active:scale-95"><div className="font-black text-xl">{reassCount}</div><div className="text-xs font-bold">⏰ Reassess</div></button>)}</div>)}
          {(()=>{const PMS_CODES=new Set(PMS_ITEMS.map(p=>p.code));const pmsDue=[];Object.entries(pmsRecords).forEach(([plate,items])=>{const plateAssessments=assessments.filter(a=>a.header.plate===plate).sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));const latestA=plateAssessments[0];if(!latestA)return;const currentOdo=parseInt(latestA.header.odometer)||vehicleRegistry[plate]?.lastOdo||0;let worstDays=Infinity;let overdueCount=0;let dueSoonCount=0;Object.entries(items||{}).forEach(([code,rec])=>{if(!PMS_CODES.has(code))return;if(!rec)return;const hasDate=!!rec.nextDate;const hasOdo=rec.nextOdo!=null&&rec.nextOdo!==0;if(!hasDate&&!hasOdo)return;const days=hasDate?daysUntilDue(rec.nextDate):Infinity;const km=hasOdo?kmUntilDue(rec.nextOdo,currentOdo):Infinity;const isOverdue=days<0||km<0;const isDueSoon=!isOverdue&&(days<=30||km<=2000);if(isOverdue)overdueCount++;else if(isDueSoon)dueSoonCount++;if(hasDate&&days<worstDays)worstDays=days;});if(overdueCount>0||dueSoonCount>0)pmsDue.push({plate,overdueCount,dueSoonCount,worstDays:worstDays===Infinity?9999:worstDays,currentOdo,clientName:latestA.header.client});});if(pmsDue.length===0)return null;pmsDue.sort((a,b)=>a.worstDays-b.worstDays);return(<div className="mb-4"><div className="flex items-center justify-between mb-2"><span className="font-bold text-gray-700 text-sm">🔧 PMS Due</span><span className="text-xs text-gray-400">{pmsDue.length} vehicle{pmsDue.length>1?"s":""}</span></div><div className="space-y-2">{pmsDue.slice(0,3).map(({plate,overdueCount,dueSoonCount,worstDays,currentOdo,clientName})=>{const isOverdue=overdueCount>0;return(<button key={plate} onClick={()=>setVehiclePlate(plate)} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-left active:scale-95 transition-all ${isOverdue?"border-red-300 bg-red-50":"border-amber-200 bg-amber-50"}`}><div><div className={`font-black text-base ${isOverdue?"text-red-700":"text-amber-700"}`}>{plate}</div><div className="text-xs text-gray-500 mt-0.5">{clientName} · {currentOdo.toLocaleString()} km</div></div><div className="text-right">{isOverdue?<span className="text-xs font-black bg-red-600 text-white px-2.5 py-1 rounded-full">{overdueCount} Overdue</span>:<span className="text-xs font-black bg-amber-500 text-white px-2.5 py-1 rounded-full">{dueSoonCount} Due Soon</span>}<div className="text-xs text-gray-400 mt-1">{worstDays<0?`${Math.abs(worstDays)}d overdue`:worstDays===9999?"by km":`in ${worstDays}d`}</div></div></button>);})}</div></div>);})()}
          <button onClick={startNew} className="w-full bg-red-700 hover:bg-red-800 active:scale-95 text-white rounded-2xl py-5 font-black text-xl shadow-lg transition-all mb-4 flex items-center justify-center gap-3"><span className="text-2xl">🔍</span> Start New Assessment</button>
          <div className="bg-white rounded-2xl border border-gray-200 p-3 mb-4 flex items-center gap-2 shadow-sm"><span className="text-lg">🚗</span><input type="text" placeholder="Search plate number..." value={plateSearch} className="flex-1 text-sm font-semibold focus:outline-none text-gray-700 placeholder-gray-400" onChange={e=>{const val=e.target.value.toUpperCase();setPlateSearch(val);if(val.length>=3){const plates=[...new Set(assessments.filter(a=>a.header.plate.includes(val)).map(a=>a.header.plate))];if(plates.length===1)setVehiclePlate(plates[0]);}}}/>{plateSearch.length>=3&&<button onClick={()=>setPlateSearch("")} className="text-gray-400 font-bold text-sm">✕</button>}</div>
          {plateSearch.length>=2&&(()=>{const matches=[...new Set(assessments.filter(a=>a.header.plate.includes(plateSearch.toUpperCase())).map(a=>a.header.plate))];if(matches.length===0)return(<div className="bg-white rounded-2xl border border-gray-200 p-3 mb-4 text-sm text-gray-400 text-center">No vehicle found with "{plateSearch}"</div>);if(matches.length>1)return(<div className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">{matches.slice(0,5).map(plate=>{const latest=assessments.find(a=>a.header.plate===plate);const cfg=SC[latest.classification.overallStatus];return(<button key={plate} onClick={()=>{setVehiclePlate(plate);setPlateSearch("");}} className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"><span className="font-black text-gray-800">{plate}</span><Badge label={cfg.label} color={cfg.badge}/></button>);})}</div>);return null;})()}
          <div className="flex items-center justify-between mb-3"><span className="font-bold text-gray-700">Recent Assessments</span>{assessments.length>0&&<button onClick={()=>{setFilterStatus("all");setScreen("history");}} className="text-sm text-red-700 font-bold">View All →</button>}</div>
          {branchFiltered.length===0?(<div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center"><div className="text-4xl mb-2">📋</div><div className="text-gray-500 text-sm font-medium">No assessments yet.</div></div>):(<div className="space-y-3">{branchFiltered.slice(0,5).map(a=><ACard key={a.id} a={a} onClick={()=>{setCurrentA(a);setScreen("result");}} onPlateClick={p=>setVehiclePlate(p)}/>)}</div>)}
        </div>
        {BottomNav}
      </div>
    );
  }

  if(screen==="new"){
    return(
      <div className="min-h-screen bg-gray-50">
        <TopBar title="Vehicle Details" sub={reAssessFrom?`Re-Assessment — ${reAssessFrom.header.plate}`:"Step 1 of 2 — Header Information"} onBack={()=>setScreen("dashboard")}/>
        <div className="px-4 pt-5 pb-28">
          {reAssessFrom&&(()=>{const prevFails=ALL_ITEMS.filter(i=>reAssessFrom.itemResults[i.code]?.resultCode==="fail_critical");const prevMons=ALL_ITEMS.filter(i=>reAssessFrom.itemResults[i.code]?.resultCode==="monitor");if(prevFails.length===0&&prevMons.length===0)return null;return(<div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 mb-4"><div className="font-black text-orange-700 text-sm mb-2">🔁 Previous Assessment Issues — {reAssessFrom.rwaNumber}</div><div className="text-xs text-orange-600 mb-2">These items were flagged last time. Check them carefully.</div>{prevFails.map(item=>(<div key={item.code} className="text-xs text-red-700 font-semibold flex items-center gap-1 mb-1"><span>✕</span> {item.label}{reAssessFrom.itemResults[item.code]?.measuredValue!==undefined&&reAssessFrom.itemResults[item.code]?.measuredValue!==""&&<span className="text-red-500 font-mono ml-1">[{reAssessFrom.itemResults[item.code].measuredValue}{item.unit}]</span>}</div>))}{prevMons.map(item=>(<div key={item.code} className="text-xs text-amber-700 font-semibold flex items-center gap-1 mb-1"><span>⚠</span> {item.label}</div>))}</div>);})()}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
            {[{key:"plate",label:"Plate Number *",placeholder:"e.g. UFF 4915",upper:true},{key:"make",label:"Vehicle Make *",placeholder:"e.g. Toyota, MG, Mitsubishi"},{key:"model",label:"Vehicle Model *",placeholder:"e.g. ZS, Vios, L300"},{key:"yearModel",label:"Year Model *",placeholder:"e.g. 2023",type:"number"},{key:"technician",label:"Technician Name *",placeholder:"Enter full name"},{key:"odometer",label:"Odometer (km) *",placeholder:lastOdo>0?`Min ${lastOdo.toLocaleString()} km`:"e.g. 58210",type:"number"},{key:"date",label:"Inspection Date *",type:"date"}].map(f=>(<div key={f.key}><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">{f.label}</label><input type={f.type||"text"} placeholder={f.placeholder} value={header[f.key]} onChange={e=>setHeader({...header,[f.key]:f.upper?e.target.value.toUpperCase():e.target.value})} className={`w-full border-2 ${f.key==="odometer"&&header.odometer&&!odoValid?"border-red-500 bg-red-50":"border-gray-200"} focus:border-red-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none`}/>{f.key==="plate"&&vehicleRegistry[header.plate]&&<div className="mt-1.5 text-xs text-green-600 font-semibold">✓ Vehicle found — details auto-filled</div>}{f.key==="odometer"&&lastOdo>0&&<div className={`mt-1.5 text-xs ${header.odometer&&!odoValid?"text-red-600 font-bold":"text-gray-400"}`}>{header.odometer&&!odoValid?`⚠️ Cannot be lower than last recorded: ${lastOdo.toLocaleString()} km`:`Last recorded: ${lastOdo.toLocaleString()} km`}</div>}</div>))}
            {[{key:"client",label:"Fleet Client *",options:CLIENTS},{key:"branch",label:"Branch *",options:BRANCHES},{key:"type",label:"Assessment Type *",options:ASSESS_TYPES}].map(f=>(<div key={f.key}><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">{f.label}</label><select value={header[f.key]} onChange={e=>setHeader({...header,[f.key]:e.target.value})} className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none bg-white"><option value="">Select...</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4"><button onClick={()=>{if(reassessMode==="quickfix"){setScreen("quickfix");}else{setExpandedCat(activeCats[0]?.code||"ENG");setScreen("inspect");}}} disabled={!headerOk} className={`w-full rounded-2xl py-4 font-black text-lg transition-all ${headerOk?"bg-red-700 text-white shadow-lg active:scale-95":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{reassessMode==="quickfix"?"Document Repairs →":"Start Inspection →"}</button></div>
      </div>
    );
  }

  if(screen==="inspect"){
    const failCount=activeItemsList.filter(i=>itemResults[i.code]?.resultCode==="fail_critical").length;const monCount=activeItemsList.filter(i=>itemResults[i.code]?.resultCode==="monitor").length;const blockers=liveEng?.totalBlockerCount||0;
    const isFiltered=header.type==="Re-Assessment"||header.type==="Pre-Dispatch";
    const typeLabel=header.type==="Re-Assessment"?"Re-Assessment — Flagged Items Only":header.type==="Pre-Dispatch"?"Pre-Dispatch — Safety Critical Items Only":null;
    return(
      <div className="min-h-screen bg-gray-50">
        <div className="bg-red-700 text-white px-4 pt-12 pb-4"><div className="flex items-center gap-3 mb-3"><button onClick={()=>setScreen("new")} className="text-white/60 text-2xl">←</button><div className="flex-1 min-w-0"><div className="font-black text-lg truncate">{header.plate||"Assessment"}</div><div className="text-white/60 text-xs truncate">{header.client} · {header.branch} · {header.type}</div></div><div className="text-right shrink-0"><div className="text-xs text-white/50">{answered}/{total}</div><div className="text-sm font-black">{pct}%</div></div></div><div className="bg-red-900 rounded-full h-2 mb-2"><div className="bg-white h-2 rounded-full transition-all" style={{width:`${pct}%`}}/></div><div className="flex gap-1.5 flex-wrap">{failCount>0&&<span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded-full font-bold">🚨{failCount} Critical</span>}{monCount>0&&<span className="text-xs bg-amber-800/50 text-amber-200 px-2 py-0.5 rounded-full font-bold">⚠️{monCount} Monitor</span>}{blockers>0&&<span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">⛔{blockers} Blocker</span>}{failCount===0&&monCount===0&&answered>0&&<span className="text-xs bg-green-900/40 text-green-200 px-2 py-0.5 rounded-full font-bold">✓ All clear</span>}</div></div>
        {typeLabel&&<div className={`${header.type==="Pre-Dispatch"?"bg-blue-600":"bg-orange-600"} text-white px-4 py-2.5 flex items-center gap-2`}><span>{header.type==="Pre-Dispatch"?"🚛":"🔁"}</span><span className="text-xs font-bold">{typeLabel} — {total} item{total!==1?"s":""}</span></div>}
        {blockers>0&&<div className="bg-red-900 text-red-100 px-4 py-2.5 flex items-center gap-2"><span>⛔</span><span className="text-xs font-bold">DISPATCH BLOCKED — {blockers} hold-unit item(s). Vehicle must not be dispatched.</span></div>}
        <div className="px-4 pt-4 pb-32">{activeCats.map((cat,catIdx)=>(<CatCard key={cat.code} cat={cat} results={itemResults} onChange={(code,val)=>setItemResults(prev=>({...prev,[code]:val}))} expanded={expandedCat===cat.code} onToggle={()=>setExpandedCat(expandedCat===cat.code?null:cat.code)} onComplete={catIdx<activeCats.length-1?()=>setExpandedCat(activeCats[catIdx+1].code):null}/>))}</div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">{answered<total&&<div className="text-center text-xs text-gray-400 mb-2">{total-answered} items remaining</div>}{answered===total&&<div className="text-center text-xs text-green-600 font-bold mb-2">✓ All items answered — tap to continue</div>}<button onClick={goToPMS} disabled={answered<total} className={`w-full rounded-2xl py-4 font-black text-lg transition-all ${answered===total?"bg-red-700 text-white shadow-lg active:scale-95":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{answered===total?"Continue to PMS →":`${total-answered} items remaining`}</button></div>
      </div>
    );
  }

  if(screen==="pms"){return(<PMSScreen plate={header.plate} odometer={header.odometer} date={header.date} techName={header.technician} rwaNumber={`RWA-${new Date().getFullYear()}-PENDING`} existingPMS={pmsRecords[header.plate]||null} itemResults={itemResults} onSubmit={submitWithPMS}/>);}

  if(screen==="reassess-mode"){
    const prevA=reAssessFrom;
    if(!prevA){setScreen("dashboard");return null;}
    const flagged=ALL_ITEMS.filter(i=>{const r=prevA.itemResults?.[i.code];return r?.resultCode==="fail_critical"||r?.resultCode==="monitor";});
    const critCount=flagged.filter(i=>prevA.itemResults[i.code]?.resultCode==="fail_critical").length;
    const monCount=flagged.filter(i=>prevA.itemResults[i.code]?.resultCode==="monitor").length;
    const prevCfg=SC[prevA.classification.overallStatus];
    return(
      <div className="min-h-screen bg-gray-50">
        <TopBar title="Re-Assessment" sub={`${prevA.header.plate} — Choose mode`} onBack={()=>{setReAssessFrom(null);setReassessMode(null);setScreen("dashboard");}}/>
        <div className="px-4 pt-5 pb-28 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Previous Assessment</div>
            <div className="flex items-center justify-between mb-1"><span className="font-black text-gray-900 text-lg">{prevA.header.plate}</span><Badge label={prevCfg.label} color={prevCfg.badge}/></div>
            <div className="text-xs text-gray-400 font-mono">{prevA.rwaNumber}</div>
            <div className="text-xs text-gray-400 mt-0.5">{new Date(prevA.submittedAt).toLocaleDateString("en-PH")} · {prevA.header.branch}</div>
            <div className="flex gap-2 mt-3 flex-wrap">{critCount>0&&<span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">🚨 {critCount} Critical</span>}{monCount>0&&<span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">⚠ {monCount} Monitor</span>}</div>
          </div>
          <button onClick={()=>{setReassessMode("quickfix");setScreen("new");}} className="w-full bg-white rounded-2xl border-2 border-blue-300 p-5 text-left hover:border-blue-500 active:scale-99 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl shrink-0">🔧</div>
              <div className="flex-1"><div className="font-black text-gray-900 text-lg">Quick Fix</div><div className="text-sm text-gray-500 mt-1">Document parts already replaced. Skip inspection, go straight to replacement details + labor.</div><div className="text-xs text-blue-700 font-bold mt-2">✓ Best when repair is complete</div></div>
            </div>
          </button>
          <button onClick={()=>{setReassessMode("full");setScreen("new");}} className="w-full bg-white rounded-2xl border-2 border-gray-300 p-5 text-left hover:border-red-500 active:scale-99 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-2xl shrink-0">🔁</div>
              <div className="flex-1"><div className="font-black text-gray-900 text-lg">Full Re-Assessment</div><div className="text-sm text-gray-500 mt-1">Re-inspect all {flagged.length} flagged item{flagged.length!==1?"s":""} with pass / monitor / fail / replaced options.</div><div className="text-xs text-red-700 font-bold mt-2">✓ Best when some items still need inspection</div></div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if(screen==="quickfix"){
    if(!reAssessFrom){setScreen("dashboard");return null;}
    return(<QuickFixScreen plate={header.plate} odometer={header.odometer} date={header.date} techName={header.technician} prevAssessment={reAssessFrom} onSubmit={submitWithPMS} onBack={()=>setScreen("new")}/>);
  }

  if(screen==="result"&&currentA){
    const a=currentA;const cls=a.classification;const cfg=SC[cls.overallStatus];
    const allFindings=ALL_ITEMS.filter(i=>{const r=a.itemResults[i.code];return r?.resultCode==="fail_critical"||r?.resultCode==="monitor"||r?.resultCode==="replaced";});
    return(
      <div className="min-h-screen bg-gray-50">
        <div className={`bg-gradient-to-b ${cfg.grad} text-white px-4 pt-12 pb-8 text-center`}>
          <div className="text-xs font-bold tracking-widest opacity-60 mb-2">ASSESSMENT RESULT</div><div className="text-3xl font-black mb-1">{cfg.label}</div><div className="text-sm opacity-60 mb-4">{a.rwaNumber}</div>
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm shadow ${cls.dispatchAllowed?"bg-green-500 text-white":"bg-black/30 text-red-100"}`}>{cls.dispatchAllowed?"✓ Dispatch Allowed":"⛔ Unit on Hold — Do NOT Dispatch"}</div>
          {cls.reassessmentDue&&<div className="mt-2 text-xs opacity-70">{cls.overallStatus==="deferred"?`⏰ Reassessment by ${cls.reassessmentDue}`:`📅 Next check by ${cls.reassessmentDue}`}</div>}
          {!cls.reassessmentRequired&&cls.replacedCount>0&&<div className="mt-2 text-xs bg-white/20 px-3 py-1 rounded-full inline-block font-bold">✅ All defects resolved on-site — no reassessment required</div>}
        </div>
        <div className="px-4 -mt-4 pb-28 space-y-4">
          {a.resolvedByRwa&&(<div className="bg-green-600 text-white rounded-2xl p-4 flex items-start gap-3 shadow-lg"><div className="text-3xl">✅</div><div className="flex-1"><div className="font-black text-base">This Assessment Has Been Resolved</div><div className="text-green-100 text-xs mt-1">Superseded by <span className="font-mono font-bold">{a.resolvedByRwa}</span>{a.resolvedAt?` on ${new Date(a.resolvedAt).toLocaleDateString("en-PH")}`:""}.</div><div className="text-green-200 text-xs mt-1">Open the resolving RWA to see current vehicle status — re-assessment is disabled on this record to prevent duplicate repairs.</div></div></div>)}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Vehicle & Inspection</div><div className="grid grid-cols-2 gap-x-4 gap-y-2.5">{[["Plate",a.header.plate],["Vehicle",[a.header.make,a.header.model,a.header.yearModel?`(${a.header.yearModel})`:null].filter(Boolean).join(" ")||"—"],["Client",a.header.client],["Branch",a.header.branch],["Technician",a.header.technician],["Odometer",a.header.odometer+" km"],["Type",a.header.type],["Date",a.header.date]].map(([k,v])=>(<div key={k}><div className="text-xs text-gray-400">{k}</div><div className="text-sm font-bold text-gray-800">{v}</div></div>))}</div></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Classification</div><div className="space-y-2">{[{label:"Technical Status",value:cls.technicalStatus.toUpperCase(),color:SC[cls.technicalStatus]?.badge},{label:"Compliance",value:cls.complianceStatus==="compliant"?"COMPLIANT":"NON-COMPLIANT",color:cls.complianceStatus==="compliant"?"bg-green-100 text-green-800":"bg-red-100 text-red-800"},{label:"Dispatch Allowed",value:cls.dispatchAllowed?"YES":"NO",color:cls.dispatchAllowed?"bg-green-100 text-green-800":"bg-red-100 text-red-800"},{label:"Critical Items",value:String(cls.failCriticalCount||0),color:cls.failCriticalCount>0?"bg-red-100 text-red-800":"bg-gray-100 text-gray-600"},{label:"Dispatch Blockers",value:String(cls.totalBlockerCount||0),color:cls.totalBlockerCount>0?"bg-red-100 text-red-800":"bg-gray-100 text-gray-600"},{label:"Reassessment Due",value:cls.reassessmentDue||"None",color:cls.reassessmentDue?"bg-orange-100 text-orange-800":"bg-gray-100 text-gray-600"}].map(r=>(<div key={r.label} className="flex items-center justify-between"><span className="text-sm text-gray-500">{r.label}</span><Badge label={r.value} color={r.color}/></div>))}</div></div>
          {allFindings.length===0?(<div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center"><div className="text-4xl mb-2">✅</div><div className="font-black text-green-700 text-lg">All Items Passed</div><div className="text-green-600 text-sm mt-1">Vehicle is roadworthy and cleared for dispatch</div></div>):(<div className="rounded-2xl border-2 border-gray-200 overflow-hidden"><div className="bg-gray-800 px-4 py-3 flex items-center justify-between"><div className="font-black text-white text-sm">Assessment Findings</div><div className="flex items-center gap-2">{(()=>{const resolved=allFindings.filter(i=>{const adj=a.adjustedResults?.[i.code];return adj?.resultCode==="replaced";}).length;const stillOpen=allFindings.length-resolved;return(<>{resolved>0&&<span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">{resolved} Fixed</span>}{stillOpen>0&&<span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{stillOpen} Open</span>}</>);})()}</div></div>{allFindings.map(item=>{const orig=a.itemResults[item.code];const qf=a.quickFixes?.[item.code];const fixedInInspection=orig?.resultCode==="replaced";const fixedViaQuickFix=!!qf;const isResolved=fixedInInspection||fixedViaQuickFix;const isCrit=orig?.resultCode==="fail_critical";const isMon=orig?.resultCode==="monitor";return(<div key={item.code} className={`border-b border-gray-100 last:border-0 ${isResolved?"bg-green-50":isCrit?"bg-red-50":"bg-amber-50"}`}><div className="px-4 pt-3 pb-1 flex items-start gap-3"><div className={`shrink-0 text-xs font-black px-2 py-1 rounded-lg mt-0.5 ${isCrit&&!isResolved?"bg-red-600 text-white":isCrit&&isResolved?"bg-gray-400 text-white":isMon&&!isResolved?"bg-amber-500 text-white":"bg-gray-300 text-white"}`}>{isCrit?"CRIT":"MON"}</div><div className="flex-1 min-w-0"><div className={`font-bold text-sm ${isResolved?"text-gray-500 line-through":"text-gray-800"}`}>{item.label}</div><div className="flex items-center gap-2 flex-wrap mt-0.5">{orig?.defectCode&&<span className={`text-xs font-semibold ${isResolved?"text-gray-400":isCrit?"text-red-600":"text-amber-600"}`}>{DEFECT_CODES[orig.defectCode]}</span>}{orig?.measuredValue!==undefined&&orig.measuredValue!==""&&<span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isResolved?"bg-gray-100 text-gray-400":"bg-red-100 text-red-700"}`}>{orig.measuredValue}{item.unit}{item.threshold?` / min ${item.threshold}${item.unit}`:""}</span>}</div></div><div className="shrink-0">{isResolved?<span className="text-xs font-black bg-green-100 text-green-700 px-2.5 py-1 rounded-full">✓ FIXED</span>:<span className={`text-xs font-black px-2.5 py-1 rounded-full ${isCrit?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>⚠ OPEN</span>}</div></div>{isResolved&&(<div className="px-4 pb-3 pl-10"><div className="bg-green-100 rounded-xl px-3 py-2"><div className="text-xs font-bold text-green-700">{fixedViaQuickFix?`Replaced${qf.partReplaced?" — "+qf.partReplaced:""}`:fixedInInspection?`Replaced on-site${orig.partReplaced?" — "+orig.partReplaced:""}`:""}</div>{(qf?.afterMeasure||orig?.afterMeasure)&&<div className="text-xs text-green-600 mt-0.5">After: <span className="font-mono font-bold">{qf?.afterMeasure||orig?.afterMeasure}{item.unit}</span>{item.threshold&&<span className={`ml-1 font-bold ${parseFloat(qf?.afterMeasure||orig?.afterMeasure)>=item.threshold?"text-green-700":"text-amber-600"}`}>{parseFloat(qf?.afterMeasure||orig?.afterMeasure)>=item.threshold?"✓ OK":"⚠ Still low"}</span>}</div>}{orig?.note&&<div className="text-xs text-gray-500 italic mt-0.5">"{orig.note}"</div>}</div></div>)}{!isResolved&&(<div className="px-4 pb-3 pl-10"><div className={`rounded-xl px-3 py-2 flex items-center justify-between ${isCrit?"bg-red-100":"bg-amber-100"}`}><span className={`text-xs font-bold ${isCrit?"text-red-700":"text-amber-700"}`}>{isCrit?"⛔ Requires repair before dispatch":"⚠ Monitor — check at next visit"}</span><span className="text-xs font-bold text-gray-500">Use 🔄 Re-Assess to fix</span></div>{orig?.note&&<div className="px-3 pb-1"><div className="text-xs text-gray-500 italic">"{orig.note}"</div></div>}</div>)}</div>);})}</div>)}
          {a.resolvesRwa&&(<div className="bg-green-600 text-white rounded-2xl p-4 flex items-center gap-3"><div className="text-3xl">✅</div><div><div className="font-black">Deferred Status Resolved</div><div className="text-green-100 text-xs mt-0.5">This re-assessment cleared the dispatch hold on {a.header.plate}.</div><div className="text-green-200 text-xs mt-0.5">Resolved: {a.resolvesRwa}</div></div></div>)}
          <div className={`rounded-2xl border-2 p-4 flex items-center gap-3 ${a.fmsStatus==="pending_sync"?"border-blue-300 bg-blue-50":"border-green-300 bg-green-50"}`}><div className="text-2xl">{a.fmsStatus==="pending_sync"?"📡":"✅"}</div><div className="flex-1"><div className={`font-black text-sm ${a.fmsStatus==="pending_sync"?"text-blue-700":"text-green-700"}`}>{a.fmsStatus==="pending_sync"?"Ready — Pending Sync to MG FMS":"Synced to MG FMS Portal"}</div><div className="text-xs text-gray-400 mt-0.5">{a.fmsStatus==="pending_sync"?"This assessment will upload when connected to the network.":"Assessment confirmed in FMS portal."}</div></div></div>
          {a.pmsData&&(Object.values(a.pmsData.items||{}).some(Boolean)||a.pmsData.ecuData||a.pmsData.otherNote)?(<div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4 space-y-3"><div className="font-black text-green-700 text-sm">🔧 Services Completed This Visit</div>{PMS_ITEMS.filter(item=>a.pmsData.items?.[item.code]).length>0&&(<div className="space-y-1">{PMS_ITEMS.filter(item=>a.pmsData.items?.[item.code]).map(item=>{const upd=a.pmsData.updates?.[item.code];const detail=a.pmsData.serviceDetails?.[item.code];return(<div key={item.code} className="bg-white rounded-xl p-3 border border-green-200"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><span className="text-sm">{item.icon}</span><span className="text-sm font-semibold text-gray-800">{item.label}</span></div>{upd?.nextOdo&&(<div className="text-right"><div className="text-xs font-bold text-green-700">Next: {upd.nextOdo.toLocaleString()} km</div><div className="text-xs text-gray-400">{upd.nextDate}</div></div>)}</div>{detail?.brand&&<div className="text-xs text-blue-700 font-semibold mt-0.5">🔩 {detail.qty>1?`${detail.qty}× `:""}{detail.brand}</div>}{detail?.photos?.length>0&&(<div className="flex gap-1.5 mt-2 flex-wrap">{detail.photos.map((src,i)=>(<div key={i} className="relative"><img src={src} onClick={()=>setViewPhoto(src)} className="w-14 h-14 rounded-lg object-cover border border-gray-200 cursor-pointer"/><div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-center rounded-b-lg py-0.5 text-xs pointer-events-none">{i===0?"Before":i===1?"New":"After"}</div></div>))}</div>)}</div>);})}</div>)}{a.pmsData.ecuData?.performed&&(<div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><div className="font-bold text-blue-700 text-sm mb-1">💻 ECU Scan Performed</div>{a.pmsData.ecuData.codes?.length>0?(<div className="space-y-1">{a.pmsData.ecuData.codes.map((tc,i)=>(<div key={i} className="bg-white rounded-lg p-2 border border-blue-100 flex items-start gap-2"><span className="font-black text-red-600 text-sm font-mono">{tc.code}</span>{tc.description&&<span className="text-gray-600 text-xs flex-1">— {tc.description}</span>}</div>))}</div>):(<div className="text-xs text-green-600 font-semibold">✓ No trouble codes found</div>)}{a.pmsData.ecuData.scanNotes&&<div className="text-xs text-gray-500 italic mt-1">"{a.pmsData.ecuData.scanNotes}"</div>}</div>)}{a.pmsData.laborTypes?.length>0&&(<div className="bg-gray-800 rounded-xl p-3"><div className="font-bold text-white text-sm mb-2">👷 Job Order / Labor</div><div className="flex flex-wrap gap-1.5">{a.pmsData.laborTypes.map(lt=>(<span key={lt.code} className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">{lt.label}</span>))}</div>{a.pmsData.otherLabor&&<div className="text-xs text-gray-300 italic mt-2">"{a.pmsData.otherLabor}"</div>}</div>)}{a.pmsData.otherNote&&(<div className="bg-gray-100 rounded-xl p-3"><div className="font-bold text-gray-700 text-sm mb-0.5">📝 Other Service</div><div className="text-xs text-gray-600">{a.pmsData.otherNote}</div></div>)}{a.pmsData.notes&&<div className="text-xs text-gray-500 italic border-t border-green-100 pt-2">"{a.pmsData.notes}"</div>}</div>):(<div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center gap-3"><span className="text-gray-300 text-xl">🔧</span><span className="text-sm text-gray-400">No services recorded this visit</span></div>)}
          {currentA.supervisorCleared&&(<div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4"><div className="font-black text-blue-700 text-sm mb-1">👤 Supervisor Override Applied</div><div className="text-xs text-blue-600">Cleared by: {currentA.supervisorName}</div><div className="text-xs text-gray-400">{new Date(currentA.supervisorTs).toLocaleString("en-PH")}</div>{currentA.supervisorRemarks&&<div className="text-xs text-gray-600 mt-1 italic">"{currentA.supervisorRemarks}"</div>}</div>)}
        </div>
        {showSupervisor&&<SupervisorPanel a={currentA} defaultName={userProfile?.name||""} onSave={handleSupervisorSave} onClose={()=>setShowSupervisor(false)}/>}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3"><div className="flex gap-2 mb-2"><button onClick={()=>setScreen("dashboard")} className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 font-bold text-xs active:scale-95">🏠 Home</button><button onClick={()=>setVehiclePlate(a.header.plate)} className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 font-bold text-xs active:scale-95">🚗 Vehicle</button><button onClick={()=>setShowReport(true)} className="flex-1 border-2 border-red-200 text-red-700 rounded-xl py-2.5 font-bold text-xs active:scale-95">📄 Report</button>{canAccess(userRole,"supervisor_override")&&<button onClick={()=>setShowSupervisor(true)} className="flex-1 border-2 border-blue-200 text-blue-700 rounded-xl py-2.5 font-bold text-xs active:scale-95">👤 Super</button>}</div><div className="flex gap-2"><button onClick={()=>handleCopyShare(a)} className={`flex-1 rounded-xl py-3 font-bold text-sm transition-all active:scale-95 ${copied?"bg-green-600 text-white":"border-2 border-gray-300 text-gray-700"}`}>{copied?"✓ Copied!":"📋 Share Summary"}</button>{a.resolvedByRwa?(()=>{const resolver=assessments.find(x=>x.rwaNumber===a.resolvedByRwa);return(<button onClick={()=>{if(resolver){setCurrentA(resolver);}else{setVehiclePlate(a.header.plate);}}} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold text-sm active:scale-95">✅ View Resolving RWA →</button>);})():<button onClick={()=>startReassess(a)} className="flex-1 bg-red-700 text-white rounded-xl py-3 font-bold text-sm active:scale-95">🔄 Re-Assess</button>}</div></div>
        <PhotoLightbox src={viewPhoto} onClose={()=>setViewPhoto(null)}/>
      </div>
    );
  }

  if(screen==="history"){return(<div className="min-h-screen bg-gray-50"><TopBar title="Assessment History" sub={`${filtered.length} of ${assessments.length} records`} onBack={()=>setScreen("dashboard")}/><div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2.5"><input type="text" placeholder="🔍  Search plate number..." value={searchPlate} onChange={e=>setSearchPlate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400"/><div className="flex gap-2 overflow-x-auto pb-0.5">{[["all","All"],["active","Active"],["conditional","Conditional"],["deferred","Deferred"]].map(([k,l])=>(<button key={k} onClick={()=>setFilterStatus(k)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterStatus===k?"bg-red-700 text-white":"bg-gray-100 text-gray-500"}`}>{l}</button>))}<div className="w-px bg-gray-200 mx-1"/>{["all",...BRANCHES].map(b=>(<button key={b} onClick={()=>setFilterBranch(b)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterBranch===b?"bg-gray-700 text-white":"bg-gray-100 text-gray-500"}`}>{b==="all"?"All Branches":b}</button>))}</div></div><div className="px-4 pt-4 pb-28 space-y-3">{filtered.length===0?(<div className="text-center py-16"><div className="text-4xl mb-3">🔍</div><div className="text-gray-500 font-semibold">No results</div><div className="text-gray-400 text-sm mt-1">Try adjusting your filters</div></div>):filtered.map(a=>(<ACard key={a.id} a={a} onClick={()=>{setCurrentA(a);setScreen("result");}} onPlateClick={p=>setVehiclePlate(p)}/>))}</div>{BottomNav}</div>);}

  if(screen==="analytics"&&canAccess(userRole,"analytics")){return(<div className="min-h-screen bg-gray-50"><Analytics assessments={branchFiltered} onBack={()=>setScreen("dashboard")} bottomNav={BottomNav}/></div>);}
  if(screen==="analytics"&&!canAccess(userRole,"analytics")){setScreen("dashboard");return null;}

  if(screen==="settings"){
    const saveMech=async(m)=>{setMechanic(m);await persistMechanic(m);if(userProfile){const updated={...userProfile,name:m.name,branch:m.branch};setUserProfile(updated);try{await saveUserProfile(user.uid,{name:m.name,branch:m.branch});}catch(_){}}};
    const roleCfg=ROLES[userRole]||ROLES.technician;
    return(
      <div className="min-h-screen bg-gray-50">
        <div className="bg-red-700 text-white px-4 pt-12 pb-6"><div className="text-xs font-bold tracking-widest text-red-300 mb-0.5">MG FLEET MANAGEMENT SYSTEM (FMS)</div><div className="text-2xl font-black">Settings</div></div>
        <div className="px-4 pt-5 pb-28 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-red-700 text-white flex items-center justify-center font-black text-lg shrink-0">{(userProfile?.name||user?.email||"?")[0].toUpperCase()}</div><div className="flex-1 min-w-0"><div className="font-bold text-gray-800 truncate">{userProfile?.name||"Set your name"}</div><div className="text-xs text-gray-400 truncate">{user?.email}</div><div className="flex items-center gap-2 mt-1"><span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${roleCfg.color}`}>{roleCfg.label}</span>{userProfile?.branch&&<span className="text-xs text-gray-400">{userProfile.branch}</span>}</div></div></div>
          <button onClick={()=>logout()} className="w-full bg-gray-800 text-white rounded-2xl py-4 font-black text-base active:scale-95">🚪 Log Out</button>
          <div className="bg-white rounded-2xl border-2 border-red-200 p-4"><div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">🔧 Profile</div><div className="text-xs text-gray-400 mb-3">Your name and branch pre-fill every new assessment.</div><div className="space-y-3"><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Your Name *</label><input type="text" placeholder="Enter your full name" value={mechanic.name} onChange={e=>saveMech({...mechanic,name:e.target.value})} className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"/></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Your Branch *</label><select value={mechanic.branch} onChange={e=>saveMech({...mechanic,branch:e.target.value})} className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none bg-white"><option value="">Select branch...</option>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></div>{mechanic.name&&mechanic.branch&&(<div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2"><span className="text-green-600 font-bold text-sm">✓</span><span className="text-green-700 text-sm font-semibold">{mechanic.name} — {mechanic.branch}</span></div>)}</div></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Application</div>{[["App Name","MG Fleet Management System (FMS)"],["Module","Roadworthy Assessment Engine"],["Version",APP_VERSION],["Parent Company","Master Garage Philippines"],["Platform","fleet.mastergarage.ph"]].map(([k,v])=>(<div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-bold text-gray-800 text-right max-w-[55%] leading-snug">{v}</span></div>))}</div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Branch Coverage</div>{BRANCHES.map(b=>{const count=assessments.filter(a=>a.header.branch===b).length;return(<div key={b} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-700">{b}</span><div className="flex items-center gap-2"><span className="text-xs text-gray-400">{count} assessments</span><div className={`w-2 h-2 rounded-full ${count>0?"bg-green-500":"bg-gray-300"}`}/></div></div>);})}</div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Contact</div>{[["Fleet Hotline","(02) 888-8823"],["Mobile / Viber","09182273212"],["Email","fleet@mastergarage.ph"],["Portal","fleet.mastergarage.ph"]].map(([k,v])=>(<div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-bold text-red-700">{v}</span></div>))}</div>
          {userRole==="fleet_manager"&&<div className="bg-red-50 rounded-2xl border border-red-200 p-4"><div className="text-xs font-bold text-red-400 uppercase tracking-wide mb-3">Data Management</div><button onClick={async()=>{const demoPlates=["UFF 4915","SPK 5872","ZOQ 3492"];if(!window.confirm(`Delete all Firestore data (assessments + PMS records) for demo plates ${demoPlates.join(", ")}? This cannot be undone.`))return;try{let totalAssessments=0;for(const plate of demoPlates){const n=await deleteAssessmentsByPlate(plate);totalAssessments+=n;await deletePMSRecord(plate).catch(()=>{});}alert(`Cleaned: ${totalAssessments} assessment(s) and ${demoPlates.length} PMS record(s) removed.`);}catch(e){logError("cleanDemoData",e);alert("Error: "+e.message);}}} className="w-full bg-white border-2 border-red-300 text-red-600 rounded-xl py-3 font-bold text-sm active:scale-95">🧹 Clean Demo Data (UFF 4915, SPK 5872, ZOQ 3492)</button><div className="text-xs text-red-400 text-center mt-2">Deletes demo-plate assessments and PMS records from Firestore</div></div>}
          <div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center justify-between"><span>🐛 Error Logs</span>{errorLogs.length>0&&<span className="text-red-500 font-bold">{errorLogs.length} error{errorLogs.length>1?"s":""}</span>}</div>{!errorLogsLoaded?(<button onClick={async()=>{const l=await loadErrorLogs();setErrorLogs(l);setErrorLogsLoaded(true);}} className="w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 font-bold text-sm active:scale-95">Load Error Logs</button>):errorLogs.length===0?(<div className="text-center py-4 text-gray-400"><div className="text-2xl mb-1">✅</div><div className="text-sm font-semibold">No errors recorded</div></div>):(<><div className="flex gap-2 mb-3"><button onClick={async()=>{const text=errorLogs.map(formatErrorForChat).join("\n\n");try{await navigator.clipboard.writeText(text);}catch(_){alert(text);}setErrorLogsCopied(true);setTimeout(()=>setErrorLogsCopied(false),2500);}} className={`flex-1 rounded-xl py-2.5 font-bold text-sm active:scale-95 ${errorLogsCopied?"bg-green-600 text-white":"bg-gray-800 text-white"}`}>{errorLogsCopied?"✓ Copied!":`📋 Copy All (${errorLogs.length})`}</button><button onClick={async()=>{if(window.confirm("Clear all error logs?")){await clearErrorLogs();setErrorLogs([]);}}} className="flex-1 border border-red-200 text-red-600 rounded-xl py-2.5 font-bold text-sm active:scale-95">🗑 Clear</button></div><div className="space-y-2 max-h-64 overflow-y-auto">{errorLogs.map(log=>(<div key={log.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3"><div className="flex items-start justify-between gap-2 mb-1"><span className="text-xs font-bold text-red-600">{log.context}</span><span className="text-xs text-gray-400 shrink-0">{new Date(log.timestamp).toLocaleString("en-PH")}</span></div><div className="text-xs text-gray-700 font-mono">{log.message}</div></div>))}</div></>)}</div>
        </div>
        {BottomNav}
      </div>
    );
  }

  if(screen==="users"&&canAccess(userRole,"user_management")){
    return(<UserManagement onBack={()=>setScreen("settings")} bottomNav={BottomNav}/>);
  }

  return null;
}

function UserManagement({onBack,bottomNav}){
  const[users,setUsers]=useState([]);const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(null);
  useEffect(()=>{(async()=>{try{const u=await getAllUsers();setUsers(u);}catch(e){logError("loadUsers",e);}setLoading(false);})();},[]);
  const updateRole=async(uid,role)=>{setSaving(uid);try{await saveUserProfile(uid,{role});setUsers(prev=>prev.map(u=>u.uid===uid?{...u,role}:u));}catch(e){logError("updateRole",e);alert("Failed to update role: "+e.message);}setSaving(null);};
  const updateBranch=async(uid,branch)=>{setSaving(uid);try{await saveUserProfile(uid,{branch});setUsers(prev=>prev.map(u=>u.uid===uid?{...u,branch}:u));}catch(e){logError("updateBranch",e);alert("Failed to update branch: "+e.message);}setSaving(null);};
  return(
    <div className="min-h-screen bg-gray-50">
      <TopBar title="User Management" sub={`${users.length} user${users.length!==1?"s":""}`} onBack={onBack}/>
      <div className="px-4 pt-4 pb-28 space-y-3">
        {loading?<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">👥</div><div className="font-semibold">Loading users...</div></div>:users.length===0?<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">👥</div><div className="font-semibold">No users found</div><div className="text-sm mt-1">Users are created automatically on first login</div></div>:users.map(u=>{
          const rc=ROLES[u.role]||ROLES.technician;
          return(<div key={u.uid} className={`bg-white rounded-2xl border border-gray-200 p-4 ${saving===u.uid?"opacity-50":""}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="font-bold text-gray-800 truncate">{u.name||"(No name set)"}</div>
                <div className="text-xs text-gray-400 truncate">{u.email||u.uid}</div>
                {u.branch&&<div className="text-xs text-gray-500 mt-0.5">{u.branch}</div>}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${rc.color}`}>{rc.label}</span>
            </div>
            <div className="space-y-2">
              <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Role</label><select value={u.role||"technician"} onChange={e=>updateRole(u.uid,e.target.value)} className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none bg-white"><option value="technician">Technician</option><option value="supervisor">Supervisor</option><option value="fleet_manager">Fleet Manager</option></select></div>
              <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Branch</label><select value={u.branch||""} onChange={e=>updateBranch(u.uid,e.target.value)} className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none bg-white"><option value="">All Branches</option>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
            </div>
          </div>);
        })}
        <div className="bg-gray-100 rounded-2xl p-4 text-center"><div className="text-xs text-gray-400">Users are created automatically when they log in for the first time.</div><div className="text-xs text-gray-400 mt-1">New users default to the <strong>Technician</strong> role.</div></div>
      </div>
      {bottomNav}
    </div>
  );
}
