"use client";

import { useState } from "react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

export default function DefendCasePage() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const test_markdown=`### Overview of the Case
An FIR has been lodged by a police officer against 14 named individuals for offenses including rioting, attempt to murder, and obstruction of public servants, allegedly committed at Kukuda Railway Gate. The charges involve serious IPC sections, indicating a significant confrontation with law enforcement.

### Key Legal Issues
- **Group Liability and Common Object:** The core of the case revolves around Sections 147, 148, and 149 IPC. The prosecution must prove the existence of an unlawful assembly and that the accused shared a common object to commit the alleged offenses. Individual roles and specific acts will be crucial.
- **Specific Intent for Attempt to Murder (Section 307 IPC):** Proving the intention or knowledge to cause death is paramount for this charge. The nature of the acts, injuries (if any), and the weapon used (if any) will be scrutinized.
- **Obstruction/Assault of Public Servant (Sections 186, 353 IPC):** The prosecution must establish that the complainant (a police officer) was lawfully discharging his public functions and that the accused intentionally obstructed or assaulted him.
- **Vagueness of Allegations:** The FIR names multiple accused but lacks specific details regarding the individual actions or contributions of each person to the alleged offenses.
- **"Criminal Law (2nd Amendment) Act, 1983":** This is an unusual inclusion as it is an amendment act, not a substantive penal provision under which an offense is charged. Its specific relevance or the particular section it refers to needs immediate clarification from the prosecution. It might be a clerical error or a reference to an enhanced penalty for an existing IPC offense.
- **Admissibility of Evidence:** The quality and nature of evidence collected by the police, especially since the complainant is a police officer, will be subject to close examination.

### Possible Defense Strategies
1.  **Denial of Involvement/Alibi:** The primary defense could be a complete denial of the allegations, asserting that the accused were not present at the scene or did not participate in any unlawful activity. Strong alibi evidence for each accused would be critical.
2.  **Challenging Unlawful Assembly and Common Object:** Argue that there was no unlawful assembly as defined under Section 141 IPC, or that the accused were not part of it. Alternatively, contend that even if an assembly existed, the accused did not share the alleged common object, thereby challenging the applicability of Section 149 IPC.
3.  **Lack of Intent for Attempt to Murder (Section 307 IPC):** Argue that even if an altercation occurred, there was no intention or knowledge to cause death. The acts, if any, might amount to a lesser offense like voluntarily causing hurt (Section 323/324 IPC) or grievous hurt (Section 325/326 IPC), but not attempt to murder.
4.  **Challenging Obstruction of Public Servant:** Question whether the police officer was lawfully discharging his duty at the time, or if the alleged obstruction/assault was justified (e.g., in self-defense, or due to police excess).
5.  **Individual Culpability vs. Group Liability:** Argue that even if some individuals committed offenses, the collective liability under Section 149 IPC cannot be automatically applied to all accused without specific proof of their involvement and shared common object. Each accused's role must be proven individually. 
6.  **Procedural Irregularities:** Scrutinize the FIR registration, investigation process, collection of evidence, and arrest procedures for any lapses or non-compliance with Cr.P.C. provisions.
7.  **Challenging the "Criminal Law (2nd Amendment) Act, 1983" Charge:** Demand clarification on this charge, as it is not a substantive offense. If no specific IPC section amended by this act is cited, its inclusion can be challenged as legally untenable.

### Supporting Evidence Needed
- **Alibi Evidence:** Call detail records, CCTV footage from other locations, witness statements, employment records, travel tickets, medical records, or any other documentary proof establishing the accused's presence elsewhere at the time of the incident.
- **Independent Witness Testimony:** Statements from individuals who were present at the scene but are not associated with the police, to provide an unbiased account of the events.
- **CCTV Footage:** Any available CCTV footage from the railway gate or surrounding areas that could show the actual sequence of events, the number of people involved, and the specific actions of the accused.      
- **Medical Reports:** If any accused sustained injuries during the incident, their medical examination reports can be used to counter allegations or suggest police excess.
- **Photographs/Videos:** Any media captured by bystanders or the accused themselves that could shed light on the incident.
- **Documents related to Public Duty:** If the police officer's duty is questioned, any relevant orders or documents defining his lawful function at that specific time and place.

### Legal Precautions or Next Steps
1.  **Immediate Legal Representation:** Secure experienced legal counsel specializing in criminal defense to guide the accused through the entire process.
2.  **Anticipatory Bail/Regular Bail:** Given the serious nature of charges like Section 307 IPC, immediately apply for anticipatory bail for all accused, or regular bail if already arrested.
3.  **Review FIR and Case Documents:** Obtain certified copies of the FIR, arrest memos, medical examination reports (if any), and any other documents provided by the police.
4.  **Strategic Cooperation with Investigation:** Advise the accused to cooperate with the investigation but to exercise their right to remain silent on self-incriminating questions and to only make statements in the presence of their lawyer. Avoid making any admissions without legal advice.
5.  **Evidence Collection:** Start gathering all possible alibi evidence and identifying potential defense witnesses without delay.
6.  **Monitor Investigation:** Keep a close watch on the progress of the police investigation, including any further statements recorded or evidence collected.
7.  **Challenge Vague Charges:** Prepare to challenge the vagueness of the FIR regarding individual roles and seek clarification on the "Criminal Law (2nd Amendment) Act, 1983" charge.`

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    const formData = new FormData();
    if (file) formData.append("file", file);
    if (description.trim()) formData.append("case_description", description);

    try {
      const res = await fetch(
        `/api/ai/defend-case`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
{/*👉*/}      console.log(data);
      if (data.response) {
        setResponse(data.response);
      } else {
        setResponse(data.error || "Error analyzing the case.");
      }
    } catch (err) {
      console.error("Error:", err);
      setResponse("Failed to get response from the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-black py-12 px-6">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-2xl border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-3 text-center">
          🛡️ Defend Your Case
        </h1>
        <p className="text-gray-700 text-center mb-8">
          Upload your case file or describe your situation to get possible defense strategies.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-2 text-gray-800">
              Upload Case PDF (optional)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-gray-800">
              Or Describe Your Case
            </label>
            <textarea
              rows="6"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your case details..."
              className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold w-full transition disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Get Defense Strategy"}
          </button>
        </form>

        {/* {test_markdown && ( */}
        {response && (
          <div className="mt-8 bg-gray-100 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold mb-2 text-blue-700">
              Defense Strategy:
            </h2>
            <MarkdownRenderer content={response} />
            {/* <MarkdownRenderer content={test_markdown} /> */}
          </div>
        )}
      </div>
    </div>
  );
}
