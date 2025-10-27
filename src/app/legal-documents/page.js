'use client';
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function LegalDocuments() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const documents = [
    {
      id: 1,
      title: "Non-Disclosure Agreement (NDA)",
      category: "Confidentiality",
      description: "A contract through which parties agree not to disclose information covered by the agreement.",
      icon: "🔒",
      content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on [DATE] between:

Disclosing Party: [COMPANY NAME]
Address: [COMPANY ADDRESS]

Receiving Party: [RECIPIENT NAME]
Address: [RECIPIENT ADDRESS]

1. DEFINITION OF CONFIDENTIAL INFORMATION
For purposes of this Agreement, "Confidential Information" shall include all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged.

2. OBLIGATIONS OF RECEIVING PARTY
Receiving Party agrees to:
a) Hold and maintain the Confidential Information in strict confidence
b) Not disclose the Confidential Information to any third parties
c) Not use the Confidential Information for any purpose other than evaluation

3. RETURN OF MATERIALS
All documents and other tangible objects containing or representing Confidential Information shall be promptly returned to Disclosing Party upon request.

4. TERM
This Agreement shall remain in effect for [NUMBER] years from the date first written above.

5. GOVERNING LAW
This Agreement shall be governed by the laws of [STATE/COUNTRY].

Disclosing Party: _____________________ Date: _______
Receiving Party: _____________________ Date: _______`
    },
    {
      id: 2,
      title: "Employment Agreement",
      category: "Employment",
      description: "Agreement between an employer and employee outlining terms and conditions of employment.",
      icon: "💼",
      content: `EMPLOYMENT AGREEMENT

This Employment Agreement is made and entered into as of [DATE], by and between:

Employer: [COMPANY NAME]
Address: [COMPANY ADDRESS]

Employee: [EMPLOYEE NAME]
Address: [EMPLOYEE ADDRESS]

1. POSITION AND DUTIES
Employee shall serve as [JOB TITLE] and shall perform such duties as are customarily associated with such position, including but not limited to:
[LIST OF DUTIES]

2. TERM OF EMPLOYMENT
This agreement shall commence on [START DATE] and shall continue until terminated in accordance with the provisions herein.

3. COMPENSATION
a) Base Salary: $[AMOUNT] per [PERIOD], payable in accordance with Employer's standard payroll practices
b) Benefits: Employee shall be entitled to participate in benefit plans generally available to employees

4. CONFIDENTIALITY
Employee agrees to maintain the confidentiality of all proprietary information of the Employer.

5. TERMINATION
This agreement may be terminated by either party with [NUMBER] days written notice.

6. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of [STATE].

Employer: _____________________ Date: _______
Employee: _____________________ Date: _______`
    },
    {
      id: 3,
      title: "Lease Agreement",
      category: "Real Estate",
      description: "A contract outlining the terms under which one party agrees to rent property from another party.",
      icon: "🏠",
      content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement is made and effective [DATE], by and between:

Landlord: [LANDLORD NAME]
Address: [LANDLORD ADDRESS]

Tenant: [TENANT NAME]
Address: [TENANT ADDRESS]

1. PROPERTY
Landlord hereby leases to Tenant the premises located at:
[PROPERTY ADDRESS]

2. TERM
The lease term shall be for [NUMBER] months, commencing on [START DATE] and ending on [END DATE].

3. RENT
a) Monthly Rent: $[AMOUNT] per month
b) Due Date: Rent is due on the [DAY] of each month
c) Late Fee: $[AMOUNT] if rent is more than [NUMBER] days late

4. SECURITY DEPOSIT
Tenant shall pay a security deposit of $[AMOUNT] to be held by Landlord during the lease term.

5. USE OF PREMISES
The premises shall be used solely as a private residence for Tenant and Tenant's immediate family.

6. MAINTENANCE AND REPAIRS
Tenant agrees to keep the premises in good condition and repair.

7. PETS
[PET POLICY - Allow/Prohibit pets with specific terms]

8. TERMINATION
This lease may be terminated by either party with [NUMBER] days written notice.

Landlord: _____________________ Date: _______
Tenant: _____________________ Date: _______`
    },
    {
      id: 4,
      title: "Service Agreement",
      category: "Business",
      description: "Agreement for the provision of services between a service provider and client.",
      icon: "🤝",
      content: `SERVICE AGREEMENT

This Service Agreement is entered into on [DATE] between:

Service Provider: [PROVIDER NAME]
Address: [PROVIDER ADDRESS]

Client: [CLIENT NAME]
Address: [CLIENT ADDRESS]

1. SERVICES
Provider agrees to perform the following services:
[DETAILED DESCRIPTION OF SERVICES]

2. TERM
This agreement shall commence on [START DATE] and continue until [END DATE] or completion of services.

3. COMPENSATION
a) Fee: $[AMOUNT] for the services described above
b) Payment Terms: [PAYMENT SCHEDULE]
c) Expenses: Client shall reimburse Provider for pre-approved expenses

4. DELIVERABLES
Provider shall deliver the following to Client:
[LIST OF DELIVERABLES]

5. INTELLECTUAL PROPERTY
All work product created under this agreement shall be owned by [CLIENT/PROVIDER].

6. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information.

7. TERMINATION
Either party may terminate this agreement with [NUMBER] days written notice.

Provider: _____________________ Date: _______
Client: _____________________ Date: _______`
    },
    {
      id: 5,
      title: "Purchase Agreement",
      category: "Sales",
      description: "Agreement for the sale and purchase of goods or services.",
      icon: "💰",
      content: `PURCHASE AGREEMENT

This Purchase Agreement is made on [DATE] between:

Seller: [SELLER NAME]
Address: [SELLER ADDRESS]

Buyer: [BUYER NAME]
Address: [BUYER ADDRESS]

1. GOODS/SERVICES
Seller agrees to sell and Buyer agrees to purchase:
[DETAILED DESCRIPTION OF GOODS/SERVICES]

2. PURCHASE PRICE
The total purchase price shall be $[AMOUNT].

3. PAYMENT TERMS
a) Payment Method: [CASH/CHECK/WIRE TRANSFER/OTHER]
b) Payment Schedule: [PAYMENT TERMS]

4. DELIVERY
a) Delivery Date: [DATE]
b) Delivery Location: [ADDRESS]
c) Shipping Terms: [F.O.B./C.I.F./OTHER]

5. WARRANTIES
Seller warrants that the goods are free from defects and conform to specifications.

6. RISK OF LOSS
Risk of loss shall pass to Buyer upon [DELIVERY/PAYMENT/OTHER].

7. DEFAULT
In case of default, the non-defaulting party may seek remedies available at law or equity.

Seller: _____________________ Date: _______
Buyer: _____________________ Date: _______`
    },
    {
      id: 6,
      title: "Partnership Agreement",
      category: "Business",
      description: "Agreement establishing the terms of a business partnership between two or more parties.",
      icon: "🤝",
      content: `PARTNERSHIP AGREEMENT

This Partnership Agreement is made on [DATE] between:

Partner 1: [PARTNER 1 NAME]
Address: [PARTNER 1 ADDRESS]

Partner 2: [PARTNER 2 NAME]
Address: [PARTNER 2 ADDRESS]

1. FORMATION
The parties hereby form a partnership under the name [PARTNERSHIP NAME].

2. PURPOSE
The purpose of the partnership is to engage in [BUSINESS PURPOSE].

3. CAPITAL CONTRIBUTIONS
Partner 1 shall contribute: $[AMOUNT] or [DESCRIPTION]
Partner 2 shall contribute: $[AMOUNT] or [DESCRIPTION]

4. PROFIT AND LOSS SHARING
Profits and losses shall be shared equally between the partners, unless otherwise agreed.

5. MANAGEMENT
Each partner shall have equal rights in the management of partnership business.

6. BOOKS AND RECORDS
Accurate books and records shall be maintained at the principal place of business.

7. DISSOLUTION
The partnership may be dissolved by mutual agreement of all partners.

Partner 1: _____________________ Date: _______
Partner 2: _____________________ Date: _______`
    }
  ];

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(documents.map(doc => doc.category))];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto">
        {!selectedDoc ? (
          // Index View - List of all documents
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8 mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-2xl mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-2">
                    Legal Document Library
                  </h1>
                  <p className="text-gray-600 text-lg font-medium">
                    Browse and explore common legal contract formats
                  </p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <svg className=" text-black absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search legal documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-black w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSearchTerm("")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      searchTerm === "" 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSearchTerm(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        searchTerm === category 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-200 hover:shadow-2xl group"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg mr-4 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full mb-2">
                        {doc.category}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-indigo-700 transition-colors duration-200">
                    {doc.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {doc.description}
                  </p>
                  
                  <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:text-indigo-700 transition-colors duration-200">
                    <span>View Format</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-500 text-lg">No documents found matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          // Detail View - Single document format
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8">
              {/* Back Button */}
              <button
                onClick={() => setSelectedDoc(null)}
                className="flex items-center space-x-2 mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Library</span>
              </button>

              {/* Document Header */}
              <div className="flex items-center mb-6">
                <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-2xl mr-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full mb-2">
                    {selectedDoc.category}
                  </span>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                    {selectedDoc.title}
                  </h1>
                  <p className="text-gray-600 text-lg mt-2">{selectedDoc.description}</p>
                </div>
              </div>

              {/* Document Content */}
              <div className="bg-white rounded-2xl p-6 shadow-inner border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Document Format</h2>
                  <button className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors duration-200 font-medium text-sm">
                    Copy Format
                  </button>
                </div>
                <pre className="text-gray-800 text-sm bg-gray-50 p-6 rounded-xl overflow-x-auto leading-relaxed border border-gray-200 whitespace-pre-wrap">
                  {selectedDoc.content}
                </pre>
              </div>

              {/* Additional Information */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Important Note</h3>
                    <p className="text-sm text-blue-700">
                      This is a template format. Please consult with a qualified attorney before using any legal document. 
                      Laws vary by jurisdiction and individual circumstances may require specific modifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
