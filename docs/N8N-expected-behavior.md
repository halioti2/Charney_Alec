Excellent. This is a production-grade planning document. It is a perfect "single source of truth" that clearly defines the architecture, scope, user journeys, and technical requirements for the sprint. It addresses all the critical feedback from the builder agent and our previous discussions.

My role now is to synthesize this detailed plan into the specific, actionable **n8n workflow** that will deliver the backend logic for both Path A and Path B.

Here is the final, definitive n8n node workflow.

---

### **The Final n8n Workflow (Email & PDF Capable)**

**High-Level Goal:** To provide the complete backend processing for the two primary user journeys: the automated "Auto-Approval" path and the human-in-the-loop "Manual Verification" path.

**Visual Flowchart:**

`[1. Trigger (Email/Webhook)]` -> `[2. Get Document Content]` -> `[3. Router (Doc Type)]`
    -> `[4a. Extractor (Deal Sheet)]`
    -> `[4b. Extractor (Contract)]`
    -> `[5. Gatekeeper (Clean Data)]` -> `[6. Find or Create Transaction]` -> `[7. Determine Review Status]` -> `[8. IF Review Required]`
    -> **(Yes Path - Path B)** -> `[9a. Update Status to 'needs_review']`
    -> **(No Path - Path A)** -> `[9b. Promote to Final & Update to 'approved']`
    -> `[10. File Evidence]` -> `[11. Create Event Log]`

---

### **Node-by-Node Breakdown**

#### **1. The Trigger: "Start" Node + "Gmail Trigger" + "Webhook"**

*   **Purpose:** To provide two "front doors" to the workflow.
*   **Structure:** You will have a "Gmail Trigger" and a "Webhook" node. Both of their output lines will connect to the *same* next node.
*   **Webhook Input:** `transaction_id`, `document_id`, `source_document_url`, `source_document_type`.
*   **Gmail Trigger Output:** The raw email object, including attachments.

#### **2. The Prepper: "Code" Node (Get Document Content)**

*   **Purpose:** To standardize the input for the rest of the workflow, regardless of the trigger.
*   **Logic:**
    *   If triggered by Webhook, it passes through the `source_document_url` and `source_document_type`.
    *   If triggered by Gmail, it saves the PDF attachment to a temporary location and outputs the file path. It sets `source_document_type` to "Deal Sheet" (as an MVP assumption).
*   **Output:** `document_path`, `source_document_type`, `transaction_id` (if available), etc.

#### **3. The Router: "IF" Node** (No Change)
#### **4. The Extractors: "Information Extractor" Nodes** (No Change)
#### **5. The Gatekeeper: "Code" Node (Verify & Sanitize)** (No Change)

#### **6. The Detective: "Supabase" Node (Find or Create Transaction)**

*   **Purpose:** To find the transaction "folder" or create a new one. This node is now more intelligent.
*   **Logic:**
    1.  If a `transaction_id` was passed in from the Webhook, use that to `Get One`.
    2.  If not, use the `property_address` to `Get Many` (Limit 1).
    3.  If still no result, `Insert` a new transaction with `status: 'in_review'` and `intake_status: 'processing'`.
*   **Output:** The `id` of the transaction to be used in all subsequent steps.

#### **7. The Judge: "Code" Node (Determine Review Status)**

*   **Purpose:** To implement the core business logic that decides which path to take.
*   **Input:** The cleaned JSON from the Gatekeeper.
*   **Logic:**
    ```javascript
    const item = items[0].json;
    // The core rule for the "Happy Path"
    if (item.detected_conflicts.length === 0 && item.sale_price !== null) {
      item.requires_review = false;
    } else {
      item.requires_review = true;
    }
    return item;
    ```
*   **Output:** The cleaned JSON, now with an added `requires_review` boolean flag.

#### **8. The Final Router: "IF" Node**

*   **Purpose:** To branch the workflow to either the Auto-Approval path or the Manual Verification path.
*   **Condition:** Checks the `requires_review` flag from the "Judge" node.

---

### **The Two Final Paths**

#### **Path A: Auto-Approval (IF `requires_review` is false)**

**9b. The Promoter: "Supabase" Node (Promote & Approve)**
*   **Purpose:** To perform the final, automated update.
*   **Action:** `Update` the `transactions` table.
*   **Mapping:**
    *   `final_sale_price`: `{{ $nodes["Judge"].json.sale_price }}`
    *   `final_buyer_name`: `{{ $nodes["Judge"].json.buyer_name }}`
    *   `final_broker_agent_name`: `{{ $nodes["Judge"].json.broker_agent_name }}`  
    *   *(map all remaining `final_...` fields from the clean JSON such as `final_agent_split_percent`, `final_co_broker_agent_name`, etc.)*
    *   `status`: `approved`
    *   `intake_status`: `completed`

#### **Path B: Manual Verification (IF `requires_review` is true)**

**9a. The Pauser: "Supabase" Node (Update to 'needs_review')**
*   **Purpose:** To pause the workflow and signal for human intervention.
*   **Action:** `Update` the `transactions` table.
*   **Mapping:**
    *   `status`: `needs_review`
    *   `intake_status`: `completed`

---

### **The Final Shared Steps**

The two paths merge back together for the final logging steps.

#### **10. The Filer: "Supabase" Node (File Evidence)**

*   **Purpose:** To save the complete snapshot of what the AI found.
*   **Action:** `Insert` a new row into the **`commission_evidences`** table.
*   **Mapping:**
    *   `transaction_id`: The ID from the "Find or Create" node.
    *   `extraction_data`: The entire clean JSON from the "Judge" node.
    *   `requires_review`: The boolean flag from the "Judge" node.
*   **Output:** The `id` of the newly created evidence row.

#### **11. The Logger: "Supabase" Node (Create Transaction Event)**

*   **Purpose:** To create the final, immutable audit log entry.
*   **Action:** `Insert` a new row into the **`transaction_events`** table.
*   **Mapping:**
    *   `transaction_id`: The ID from the "Find or Create" node.
    *   `event_type`: Use an expression: `{{ $nodes["Judge"].json.requires_review ? 'document_requires_review' : 'document_parsed_successfully' }}`
    *   `related_extraction_id`: The `id` from the output of the "File Evidence" node.

This workflow is now a complete and robust implementation of the detailed plan you've provided. It correctly handles both user journeys and aligns perfectly with your final database schema.
