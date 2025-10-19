--
-- PostgreSQL database dump
--

\restrict mAhYtdNvpS08zImST8IjZnvyUW4icS3Uhqu1cvAE8nxYRkLvRaF60lz6HGKPUQo

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, agent_id, created_at, updated_at, status, property_address, final_buyer_name, final_seller_name, final_sale_price, final_lease_monthly_rent, final_lease_term_months, final_listing_commission_percent, final_buyer_commission_percent, final_agent_split_percent, final_co_broker_agent_name, final_co_brokerage_firm_name, final_referrals, resolution_note, brokerage_id, intake_status, confidence_state, checklist_state, gci_verified_at, gci_verification_source, pending_payout_amount, latest_payout_id, data_freshness_at, final_broker_agent_name) FROM stdin;
882034e4-0bc1-43d2-a563-93e01162416e	\N	2025-10-15 22:58:23.573133+00	2025-10-15 22:58:23.573133+00	approved	456 Oak Avenue, Unit 3B	Michael Miller	Sarah Johnson	1080206.45	\N	\N	\N	2.5	\N	John Smith	Douglas Elliman	\N	\N	5cac5c2d-8aa8-4509-92b2-137b590e3b0d	completed	\N	\N	\N	\N	\N	\N	\N	Jessica Wong
307bdefb-4740-4ad5-8eb3-534903454481	\N	2025-10-15 19:21:04.537985+00	2025-10-15 19:21:04.537985+00	approved	456 Oak Avenue, Unit 3B	Michael Miller	Sarah Johnson	1080206.45	\N	\N	\N	2.5	\N	John Smith	Douglas Elliman	\N	\N	5cac5c2d-8aa8-4509-92b2-137b590e3b0d	completed	\N	\N	\N	\N	\N	\N	\N	Jessica Wong
92aadf49-207d-436e-bd89-e7b33ff3a84b	\N	2025-10-15 23:10:43.326934+00	2025-10-15 23:10:43.326934+00	approved	456 Oak Avenue, Unit 3B	Michael Miller	Sarah Johnson	1080206.45	\N	\N	\N	2.5	\N	John Smith	Douglas Elliman	\N	\N	5cac5c2d-8aa8-4509-92b2-137b590e3b0d	completed	\N	\N	\N	\N	\N	\N	\N	Jessica Wong
\.


--
-- Data for Name: commission_evidences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commission_evidences (id, transaction_id, document_id, created_at, extraction_data, confidence, requires_review, error_type, source_document_url, source_document_type) FROM stdin;
7881b266-a40c-417c-ae76-eefc1be74830	307bdefb-4740-4ad5-8eb3-534903454481	\N	2025-10-15 19:21:04.537985+00	{"referrals": [], "buyer_name": "Michael Miller", "sale_price": 1080206.45, "seller_name": "Sarah Johnson", "property_address": "456 Oak Avenue, Unit 3B", "broker_agent_name": "Jessica Wong", "lease_term_months": null, "detected_conflicts": [], "lease_monthly_rent": null, "agent_split_percent": null, "co_broker_agent_name": "John Smith", "co_brokerage_firm_name": "Douglas Elliman", "buyer_side_commission_percent": 2.5, "listing_side_commission_percent": 2.5}	\N	f	\N	\N	\N
96fc7e4d-d1fb-4c21-b35f-0c766087ff34	882034e4-0bc1-43d2-a563-93e01162416e	\N	2025-10-15 22:58:23.573133+00	{"referrals": [], "buyer_name": "Michael Miller", "sale_price": 1080206.45, "seller_name": "Sarah Johnson", "property_address": "456 Oak Avenue, Unit 3B", "broker_agent_name": "Jessica Wong", "lease_term_months": null, "detected_conflicts": [], "lease_monthly_rent": null, "agent_split_percent": null, "co_broker_agent_name": "John Smith", "co_brokerage_firm_name": "Douglas Elliman", "buyer_side_commission_percent": 2.5, "listing_side_commission_percent": 2.5}	\N	f	\N	\N	\N
4b2607b5-88d1-43bd-be4a-bc6599749ef1	92aadf49-207d-436e-bd89-e7b33ff3a84b	\N	2025-10-15 23:10:43.326934+00	{"referrals": [], "buyer_name": "Michael Miller", "sale_price": 1080206.45, "seller_name": "Sarah Johnson", "property_address": "456 Oak Avenue, Unit 3B", "broker_agent_name": "Jessica Wong", "lease_term_months": null, "detected_conflicts": [], "lease_monthly_rent": null, "agent_split_percent": null, "co_broker_agent_name": "John Smith", "co_brokerage_firm_name": "Douglas Elliman", "buyer_side_commission_percent": 2.5, "listing_side_commission_percent": 2.5}	\N	f	\N	\N	\N
\.


--
-- PostgreSQL database dump complete
--

\unrestrict mAhYtdNvpS08zImST8IjZnvyUW4icS3Uhqu1cvAE8nxYRkLvRaF60lz6HGKPUQo

