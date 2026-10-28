# Farmhand Hub

Team 18 buildathon prototype for a farm operations copilot: it turns field updates into reviewed events, connects events to blocks and harvest lots, and keeps source evidence available for farm questions.

## Run the demo

Open `index.html` in a browser. No install, API key, or backend is required.

## Demo flow

1. Explore the farm operations twin. Select a block to inspect its planting context and saved event timeline.
2. Select **Load full demo chat**, then **Organize update**. The sample includes harvests, irrigation and equipment issues, crop health, a quality sort, cooler handling, a missing bed, and a proposed correction.
3. Review all 12 drafts. The basil harvest deliberately has no bed, and the 22-pound correction is marked as a proposal; neither detail is silently applied to another record.
4. Select **Confirm & save all records**. Known facts are saved, while the missing location and correction stay marked as follow-ups.
5. Ask Farmhand **What needs attention?** and **What happened in Bed 8?** Answers link to their source records.
6. Find the Bed 8 spring-mix harvest and select **Trace lot**. The planting source and the cooler event from the same pasted chat should appear in its trace.
7. Select **Correct** on the Bed 8 harvest, enter 22 pounds, and add the reason from the chat. The log retains the old value and reason.
8. Ask Farmhand questions or preview the local worksheet. The worksheet remains a demo template, not an official MOSA form.

The extractor and operations assistant are local rule-based prototypes, not a connected language model. They only organize information that matches the current demo rules and cannot reason over arbitrary farm documents. They do not infer entries spanning multiple quantities in one line. A relative date such as “today” is shown as a proposed date and requires explicit confirmation. Saved records, lot handling events, and correction history use this browser's local storage and do not sync between devices. The farm map and planting source are fictional context. Sample chats are invented and are not imported from or connected to iMessage. No sensor, weather, inventory, or MOSA system is connected.

## MOSA Records

Open **MOSA Records** in the workspace navigation to prepare a field activity log from saved Farm Work Log entries. Filter by field/bed and inclusive date range, edit the generated rows in the review table, mark rows reviewed, then download CSV or PDF. Each row links back to its original work log entry; exports include the source ID/link and saved source excerpt. Unresolved correction proposals and undated entries are excluded, and missing date, location, subject, activity, or harvest quantity are surfaced instead of filled in. MOSA edits stay in a separate local draft and do not change the source work log.

The export is a MOSA-aligned working log, not an official MOSA form or a compliance determination. Organic recordkeeping must be adapted to the operation and contain adequate detail for inspection and traceability; confirm record requirements and missing information with your certifier.

This prototype does not connect to iMessage, submit anything to MOSA, or make compliance claims.


## Public team demo

The hosted demo URL uses `?demo=1` to initialize fictional sample records in each visitor's browser. Records and edits stay in that browser's local storage and are not shared or synchronized between visitors. No production farm data is included.
