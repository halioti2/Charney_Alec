"Happy Path" in your User Journey 1 section. 
(Accountant / Coordinator)
The Coordinator logs in and sees the "Commission Queue" on their dashboard.
They click the "Process" button on a specific deal marked "Needs Review."
A large, two-panel modal opens. The left panel prompts them to "Upload Deal Sheet."
They click the upload area and select the Deal Sheet PDF. The system shows a "Parsing Document..." animation.
After a few seconds, the left panel displays the full Deal Sheet PDF, and the right panel instantly populates with the extracted data.
A prominent badge at the top of the right panel displays a "99% Confidence Score."
The Coordinator quickly verifies the populated fields against the PDF.
Below the data, they see a "Compliance Checklist" with placeholders for "Contract of Sale" and "Invoice." They drag and drop these two additional PDFs into the checklist area.
As each document is attached, the corresponding checklist item turns green with a checkmark.
Once all checklist items are complete, the previously grayed-out "Submit for Broker Approval" button at the bottom of the modal turns bright red and becomes clickable.
The Coordinator clicks the button, the modal closes, and the status of the deal in their queue changes to "Pending Broker Approval."
"Edge Cases"
Let's think about what could go wrong during the PDF upload and parsing workflow. Identifying these now will save significant development time and prevent user frustration later.
Here are some key questions to consider:
File Upload Issues:
What happens if the user tries to upload the wrong file type (e.g., a .jpg or .docx instead of a .pdf)?
What if the user uploads a password-protected PDF?
What if the uploaded PDF is a blurry scan and the text is unreadable?
Parsing & Confidence Issues:
What should the UI show if the AI parsing results in a low confidence score (e.g., below 70%)?
How does a user manually correct a field if the AI extracts the wrong information?
Compliance & Document Issues:
What if the user tries to submit for approval but is missing a mandatory document like the Contract of Sale?
Edge Cases & System Responses:
Scenario: User uploads an incorrect file type (e.g., .jpg).
System Response: Display an immediate error message: "Invalid file type. Please upload a PDF document." The system should reject the file.
Scenario: The uploaded PDF is unreadable or password-protected.
System Response: After attempting to parse, show an error: "Unable to read document. The file may be corrupt or password-protected. Please upload a valid deal sheet."
Scenario: The AI returns a low confidence score (e.g., below 70%).
System Response: Display a prominent warning message: "Low Confidence Score. Please manually verify all fields carefully." The pre-populated fields might be highlighted in yellow to indicate uncertainty.
Scenario: A user needs to correct an AI-extracted data point.
System Response: All pre-populated form fields on the right-hand panel must be editable, allowing the user to click and type to fix any errors.
Scenario: User tries to submit for approval without attaching all mandatory documents.
System Response: The "Submit for Broker Approval" button will remain disabled. A message in the Compliance Checklist should indicate "Missing required documents."
Key Data Fields & Document Requirements:
Data to be Parsed by AI from the Deal Sheet:
Property Address
Purchase Price
Gross Commission Income (GCI)
Commission Split Type (e.g., Listing Side vs. Client Side)
Referral Fee / Nuances
Agent Name(s)
All Deductions (e.g., E&O Insurance, Transaction Fees)
Final Net Payout to Agent
Mandatory Document Attachments for Compliance:
Deal Sheet (The primary parsed document)
Contract Documents (e.g., Contract of Sale, Lease)
Invoice
Disclosure Forms

UI/UX & Component Scope: The Verification Modal
1. Main Layout:
A large, two-panel modal. The layout is a responsive grid that is a single column on mobile and two columns on desktop (lg:grid-cols-2).
2. Left Panel: The Document Viewer
Component: DealSheetViewer.jsx
Functionality: Displays the uploaded PDF Deal Sheet. Must be scrollable.
3. Right Panel: The Verification & Actions Hub
This panel contains several smaller components organized vertically.
Confidence Score:
A prominent badge at the top (e.g., Confidence: 99%).
It should turn yellow or red and display a warning icon if the score is low.
Verification Form:
A form with all the Key Data Fields pre-populated.
All fields must be editable so the user can manually correct parsing errors.
Compliance Checklist:
Component: ComplianceChecklist.jsx
Functionality: A list of mandatory documents. Each item has a drag-and-drop target to attach files. A green checkmark appears upon successful attachment.
Action Buttons:
The primary "Submit for Broker Approval" button is at the bottom.
Its state is controlled by the Compliance Checklist; it is disabled (grayed-out) until all mandatory documents are attached, at which point it turns bright red.

