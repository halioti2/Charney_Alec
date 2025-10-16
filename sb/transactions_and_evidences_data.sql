--
-- PostgreSQL database dump
--

\restrict rw1owtBS0BT5y5DLhbbiupIPMbPw2kRwjRnEcKgVrfddSjQrgxShhwOpK0zbzHl

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
1e5b9d67-fcc5-4543-acfd-c725d0a46ad6	\N	2025-10-15 01:12:19.503289+00	2025-10-15 01:12:19.503289+00	approved	456 Oak Avenue, Unit 3B, Brooklyn, NY 11201	Michael Miller	Sarah Johnson	1250000	\N	\N	\N	2.5	75	John Smith	Compass	\N	\N	5cac5c2d-8aa8-4509-92b2-137b590e3b0d	completed	\N	\N	\N	\N	\N	\N	\N	Jessica Wong
\.


--
-- Data for Name: commission_evidences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commission_evidences (id, transaction_id, document_id, created_at, extraction_data, confidence, requires_review, error_type, source_document_url, source_document_type) FROM stdin;
b501f5a7-9f6c-4f30-b19d-085cf8b747a0	1e5b9d67-fcc5-4543-acfd-c725d0a46ad6	\N	2025-10-15 01:12:19.503289+00	{"referrals": [{"agent_name": "Maria Garcia", "fee_percent": 25}, {"agent_name": "Tom Allen", "fee_percent": 10}], "buyer_name": "Michael Miller", "sale_price": 1250000, "seller_name": "Sarah Johnson", "property_address": "456 Oak Avenue, Unit 3B, Brooklyn, NY 11201", "broker_agent_name": "Jessica Wong", "lease_term_months": null, "detected_conflicts": [], "lease_monthly_rent": null, "agent_split_percent": 75, "co_broker_agent_name": "John Smith", "co_brokerage_firm_name": "Compass", "buyer_side_commission_percent": 2.5, "listing_side_commission_percent": 3}	\N	f	\N	\N	\N
\.


--
-- PostgreSQL database dump complete
--

\unrestrict rw1owtBS0BT5y5DLhbbiupIPMbPw2kRwjRnEcKgVrfddSjQrgxShhwOpK0zbzHl

