import type { MarketCase } from "./types";

export const mockCases: MarketCase[] = [
  {
    "market_id": "mk_trump_x_greenland_deal_signed_by_january_31",
    "source": {
      "platform": "polymarket",
      "event_url": "https://polymarket.com/markets/trump-x-greenland-deal-signed-by-january-31",
      "title": "Trump x Greenland deal signed by January 31?",
      "question": "This market will resolve to “Yes” if both Denmark and the United States sign a deal, treaty, or similar international agreement of any kind relating to Greenland by January 31, 2026, 11:59 PM ET. Otherwise, this market will resolve to “No”.\n\nAny U.S.–Danish agreement relating to Greenland will qualify, regardless of subject matter, including but not limited to sovereignty, governance, security arrangements, or access to natural resources.\n\nExamples of qualifying deals include but are not limited to a treaty that makes any portion of Greenland a U.S. territory or possession (even if the handover date for such territory or possession is later); or, a Guantánamo-style arrangement treaty establishing a defined zone in Greenland under exclusive or primary U.S. jurisdiction and control, where Denmark and Greenland’s ordinary legal authority does not apply except by U.S. permission; or agreements permitting additional U.S. troop stationing, basing access, or resource extraction rights in Greenland.\n\nThis market will resolve to “Yes” only if a qualifying agreement is formally signed by authorized representatives of both Denmark and the United States. Official announcements, statements of intent, or declarations that an agreement has been reached will not suffice unless accompanied by signatures from both sides. Whether or not a qualifying deal is later passed by the respective parliaments or enters into force will not affect this market’s resolution. Signaling from Greenland’s population will not be considered.\n\nAnnouncements, negotiations, proposals, frameworks, or understandings that are not formally signed by both parties will not qualify. Any qualifying U.S. jurisdiction, control, basing rights, or access arrangements in Greenland that existed at market creation will not count as new qualifying agreements.\n\nThe primary resolution source for this market will be official information from the governments of the United States and Denmark; however, a consensus of credible reporting may also be used.",
      "resolution_deadline": "2026-02-02T04:59:00Z",
      "resolution_window": {
        "start": "2026-01-31T04:59:00Z",
        "end": "2026-02-02T04:59:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "NO",
      "official_resolved_at": "2026-01-31T00:00:00Z",
      "last_updated_at": "2026-01-31T00:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Title: Trump x Greenland deal signed by January 31?",
          "event_definition": "A formal agreement signed by authorized representatives of both Denmark and the United States relating to Greenland by January 31, 2026, 11:59 PM ET.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-02T04:59:00Z",
          "resolution_window": {
            "start": "2026-01-31T04:59:00Z",
            "end": "2026-02-02T04:59:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "us_gov",
            "dk_gov",
            "credible_media"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"U.S.\\u2013Danish agreement relating to Greenland\", \"predicate\": \"signed by authorized representatives of both Denmark and the United States\", \"threshold\": null, \"timeframe\": \"by January 31, 2026, 11:59 PM ET\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Official signed agreement between Denmark and the United States relating to Greenland",
            "source_targets": [],
            "expected_fields": [
              "agreement_text",
              "signatory_names",
              "signatory_titles",
              "signing_date"
            ],
            "selection_policy": {
              "strategy": "multi_source_quorum",
              "quorum": 1
            },
            "deferred_source_discovery": true
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "The agreement must be formally signed by authorized representatives of both Denmark and the United States.",
            "Official announcements or statements of intent without signatures do not qualify.",
            "Existing agreements at market creation do not count."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f4b2c1d",
        "requirements": [
          "req_001"
        ],
        "sources": [],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": {
      "market_id": "mk_trump_x_greenland_deal_signed_by_january_31",
      "outcome": "NO",
      "confidence": 0.65,
      "por_root": "0x489040b2411017604c29d1de6d9d21cb74f7d704dba9bd339963c222329fc36e",
      "prompt_spec_hash": "0x766d0ea9203186b4528a0e63c9f79133c336785fae432d51355a1bb3b490ffe9",
      "evidence_root": "0xcdd6fcb66f4f4507ff867278d8a4a304aa3dd172346d93ebfbdef380bcd9f14c",
      "reasoning_root": "0x0e7509fb4db4639a0f19d4d1e20fbef1b349d83a1a4102baaca7cb459469bf52",
      "ok": true,
      "verification_ok": true,
      "execution_mode": "dry_run",
      "executed_at": "2026-01-31T00:00:43Z",
      "duration_ms": 4192,
      "checks": [],
      "errors": [],
      "evidence_summary": "The evidence consists of historical agreements, recent developments, and Trump initiatives related to US-Denmark agreements on Greenland. No official agreement was signed by January 31, 2025.",
      "reasoning_summary": "The evidence was analyzed to determine if a formal agreement was signed by the specified date. The evidence indicates no such agreement was signed, leading to a conclusion of NO.",
      "justification": "Market: Title: Trump x Greenland deal signed by January 31?\nOutcome: NO\nConfidence: 65%\nRule Applied: R_BINARY_DECISION\n\nEvidence Summary:\nThe evidence consists of historical agreements, recent developments, and Trump initiatives related to US-Denmark agreements on Greenland. No official agreement was signed by January 31, 2025.\n\nReasoning:\nThe evidence was analyzed to determine if a formal agreement was signed by the specified date. The evidence indicates no such agreement was signed, leading to a conclusion of NO.\n\nKey Conclusions:\n  1. Evidence is valid and sufficient.\n  2. NO",
      "evidence_items": [
        {
          "evidence_id": "65a6ecc19205fb5f",
          "source_uri": "serper:search",
          "source_name": "discover",
          "tier": 2,
          "fetched_at": "2026-01-01T00:00:00Z",
          "content_hash": "69776967ca74a252b3a0428baef8aaa4150fc57647ff9062603c2fbf24981cf0",
          "parsed_excerpt": "{\"historical_agreements\": [{\"year\": 1951, \"description\": \"Defense of Greenland agreement signed April 9, 1951, allowing US military presence\"}, {\"year\": 2004, \"description\": \"Igaliku Agreement signed August 6, 2004, amending defense arrangements\"}], \"recent_developments\": [{\"date\": \"2025-04-11\", \"description\": \"Denmark moving towards ratifying a new US defense deal, but not finalized or signed by Jan 31, 2025\"}, {\"date\": \"2026-01-28\", \"description\": \"Diplomatic talks started to ease tensions, no",
          "status_code": 200
        }
      ],
      "reasoning_steps": [
        {
          "step_id": "step_001",
          "step_type": "evidence_analysis",
          "description": "Analyzing the provided evidence for any signed agreement by the deadline.",
          "conclusion": "No agreement signed by January 31, 2025.",
          "confidence_delta": 0.0,
          "depends_on": []
        },
        {
          "step_id": "step_002",
          "step_type": "rule_application",
          "description": "Applying R_VALIDITY to check if the evidence is sufficient.",
          "conclusion": "Evidence is valid and sufficient.",
          "confidence_delta": 0.0,
          "depends_on": []
        },
        {
          "step_id": "step_003",
          "step_type": "rule_application",
          "description": "Applying R_BINARY_DECISION to map evidence to a YES/NO outcome.",
          "conclusion": "NO",
          "confidence_delta": 0.0,
          "depends_on": []
        },
        {
          "step_id": "step_004",
          "step_type": "confidence_assessment",
          "description": "Assessing confidence in the conclusion based on evidence quality.",
          "conclusion": "Confidence increased to 0.6",
          "confidence_delta": 0.1,
          "depends_on": []
        }
      ],
      "confidence_breakdown": {
        "base": 0.6,
        "adjustments": [
          {
            "reason": "High provenance sources",
            "delta": 0.05
          }
        ],
        "final": 0.65
      },
      "llm_review": {
        "reasoning_valid": true,
        "issues": [],
        "confidence_adjustments": [
          {
            "reason": "High provenance sources",
            "delta": 0.05
          }
        ],
        "final_justification": "The evidence clearly indicates that no formal agreement was signed by the specified deadline. The reasoning is sound and the confidence is adjusted upwards due to the reliability of the sources."
      }
    }
  },
  {
    "market_id": "mk_tsla_quarterly_earnings_nongaap_eps_01_28_2026_0pt45",
    "source": {
      "platform": "polymarket",
      "event_url": "https://polymarket.com/markets/tsla-quarterly-earnings-nongaap-eps-01-28-2026-0pt45",
      "title": "Will Tesla (TSLA) beat quarterly earnings?",
      "question": "As of market creation, Tesla is estimated to release earnings on January 28, 2026. The Street consensus estimate for Tesla’s non-GAAP EPS for the relevant quarter is $0.45 as of market creation. This market will resolve to \"Yes\" if Tesla reports non-GAAP EPS greater than $0.45 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf Tesla releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-02T22:00:00Z",
      "resolution_window": {
        "start": "2026-01-28T22:00:00Z",
        "end": "2026-02-01T22:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-28T22:00:00Z",
      "last_updated_at": "2026-01-28T22:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Tesla (TSLA) beat quarterly earnings?",
          "event_definition": "Tesla reports non-GAAP EPS greater than $0.45 for the relevant quarter in its next quarterly earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-02T22:00:00Z",
          "resolution_window": {
            "start": "2026-01-28T22:00:00Z",
            "end": "2026-02-01T22:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Tesla (TSLA)\", \"predicate\": \"non-GAAP EPS > $0.45\", \"threshold\": \"0.45\", \"timeframe\": \"2026-01-28\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Fetch Tesla's non-GAAP EPS from the company's official earnings documents or SeekingAlpha.",
            "source_targets": [
              {
                "uri": "https://ir.tesla.com/financial-information/quarterly-results",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/TSLA/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "The earnings release will occur on or before 2026-03-14.",
            "Non-GAAP EPS figures are available from the specified sources."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_1234567890abcdef",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_meta_quarterly_earnings_gaap_eps_01_28_2026_8pt19",
    "source": {
      "platform": "polymarket",
      "event_url": "https://polymarket.com/markets/meta-quarterly-earnings-gaap-eps-01-28-2026-8pt19",
      "title": "Will Meta Platforms (META) beat quarterly earnings?",
      "question": "As of market creation, Meta Platforms is estimated to release earnings on January 28, 2026. The Street consensus estimate for Meta Platforms's GAAP EPS for the relevant quarter is $8.19 as of market creation. This market will resolve to \"Yes\" if Meta Platforms reports GAAP EPS greater than $8.19 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the GAAP EPS listed in the company’s official earnings documents. \n\nIf Meta Platforms releases earnings without GAAP EPS, then the market will resolve according to the GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve to “No”.\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for GAAP EPS. \nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless this is not published, in which case it refers to basic GAAP EPS.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-03-14T22:00:00Z",
      "resolution_window": {
        "start": "2026-01-28T22:00:00Z",
        "end": "2026-02-01T22:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-28T22:00:00Z",
      "last_updated_at": "2026-01-28T22:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Meta Platforms (META) beat quarterly earnings?",
          "event_definition": "Meta Platforms reports GAAP EPS greater than $8.19 for the relevant quarter in its next quarterly earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-03-14T22:00:00Z",
          "resolution_window": {
            "start": "2026-01-28T22:00:00Z",
            "end": "2026-02-01T22:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Meta Platforms (META)\", \"predicate\": \"GAAP EPS > $8.19\", \"threshold\": \"8.19\", \"timeframe\": \"2026-01-28\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "GAAP EPS from Meta Platforms' official earnings documents or SeekingAlpha if not available.",
            "source_targets": [
              {
                "uri": "https://investor.fb.com/financials/default.aspx",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/META/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "GAAP EPS refers to diluted GAAP EPS unless not published, then basic GAAP EPS.",
            "Figures are rounded to the nearest cent using standard rounding.",
            "IFRS EPS is treated as GAAP EPS.",
            "Figures are expressed in USD unless otherwise indicated.",
            "Market refers to shares traded in the U.S. on U.S. stock exchanges."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f4b2c9e",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_ibm_quarterly_earnings_nongaap_eps_01_28_2026_4pt29",
    "source": {
      "platform": "polymarket",
      "event_url": "https://polymarket.com/markets/ibm-quarterly-earnings-nongaap-eps-01-28-2026-4pt29",
      "title": "Will International Business Machines (IBM) beat quarterly earnings?",
      "question": "As of market creation, International Business Machines is estimated to release earnings on January 28, 2026. The Street consensus estimate for International Business Machines’s non-GAAP EPS for the relevant quarter is $4.29 as of market creation. This market will resolve to \"Yes\" if International Business Machines reports non-GAAP EPS greater than $4.29 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf International Business Machines releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-02T22:00:00Z",
      "resolution_window": {
        "start": "2026-01-28T22:00:00Z",
        "end": "2026-02-01T22:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-28T22:00:00Z",
      "last_updated_at": "2026-01-28T22:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will International Business Machines (IBM) beat quarterly earnings?",
          "event_definition": "IBM's non-GAAP EPS for the relevant quarter is greater than $4.29 as reported in the company's official earnings documents or SeekingAlpha within 96 hours of market close on the earnings announcement day.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-02T22:00:00Z",
          "resolution_window": {
            "start": "2026-01-28T22:00:00Z",
            "end": "2026-02-01T22:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"International Business Machines (IBM)\", \"predicate\": \"non-GAAP EPS > $4.29\", \"threshold\": \"4.29\", \"timeframe\": \"2026-01-28\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "non-GAAP EPS from IBM's official earnings documents or SeekingAlpha",
            "source_targets": [
              {
                "uri": "https://www.ibm.com/investor/earnings",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/IBM/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "The primary headline non-GAAP EPS number is used if multiple versions are published.",
            "Figures are rounded to the nearest cent using standard rounding.",
            "If no earnings are released within 45 days of the estimated date, the market resolves to NO."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_1f3b9c8e",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_t_quarterly_earnings_nongaap_eps_01_28_2026_0pt47",
    "source": {
      "platform": "polymarket",
      "event_url": "https://polymarket.com/markets/t-quarterly-earnings-nongaap-eps-01-28-2026-0pt47",
      "title": "Will AT&T (T) beat quarterly earnings?",
      "question": "As of market creation, AT&T is estimated to release earnings on January 28, 2026. The Street consensus estimate for AT&T’s non-GAAP EPS for the relevant quarter is $0.47 as of market creation. This market will resolve to \"Yes\" if AT&T reports non-GAAP EPS greater than $0.47 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf AT&T releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-01T14:00:00Z",
      "resolution_window": {
        "start": "2026-01-28T14:00:00Z",
        "end": "2026-02-01T14:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-28T14:00:00Z",
      "last_updated_at": "2026-01-28T14:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will AT&T (T) beat quarterly earnings?",
          "event_definition": "AT&T reports non-GAAP EPS greater than $0.47 for the relevant quarter in its next quarterly earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-01T14:00:00Z",
          "resolution_window": {
            "start": "2026-01-28T14:00:00Z",
            "end": "2026-02-01T14:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"AT&T (T)\", \"predicate\": \"non-GAAP EPS > $0.47\", \"threshold\": \"0.47\", \"timeframe\": \"Next quarterly earnings release on or before 2026-03-13\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "AT&T's non-GAAP EPS for the relevant quarter",
            "source_targets": [
              {
                "uri": "https://www.att.com/investors/financial-reports/earnings.html",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/T/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "AT&T will release earnings on or before 2026-03-13",
            "Figures are expressed in USD",
            "Non-GAAP EPS refers to the primary headline number, typically diluted"
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_1234567890abcdef",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_v_quarterly_earnings_nongaap_eps_01_29_2026_3pt14",
    "source": {
      "platform": "kalshi",
      "event_url": "https://kalshi.com/markets/v-quarterly-earnings-nongaap-eps-01-29-2026-3pt14",
      "title": "Will Visa (V) beat quarterly earnings?",
      "question": "As of market creation, Visa is estimated to release earnings on January 29, 2026. The Street consensus estimate for Visa’s non-GAAP EPS for the relevant quarter is $3.14 as of market creation. This market will resolve to \"Yes\" if Visa reports non-GAAP EPS greater than $3.14 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf Visa releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-03-14T22:00:00Z",
      "resolution_window": {
        "start": "2026-01-29T22:00:00Z",
        "end": "2026-02-02T22:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-29T22:00:00Z",
      "last_updated_at": "2026-01-29T22:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Visa (V) beat quarterly earnings?",
          "event_definition": "Visa's non-GAAP EPS for the relevant quarter is greater than $3.14 as reported in the company's official earnings documents or SeekingAlpha within 96 hours of the earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-03-14T22:00:00Z",
          "resolution_window": {
            "start": "2026-01-29T22:00:00Z",
            "end": "2026-02-02T22:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Visa Inc.\", \"predicate\": \"non-GAAP EPS > $3.14\", \"threshold\": \"3.14\", \"timeframe\": \"2026-01-29T22:00:00Z\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Fetch non-GAAP EPS from Visa's official earnings documents or SeekingAlpha.",
            "source_targets": [
              {
                "uri": "https://investor.visa.com/financial-information/quarterly-earnings/default.aspx",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/V/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "The non-GAAP EPS figure is available in the company's official earnings documents or SeekingAlpha within 96 hours of the earnings release.",
            "If non-GAAP EPS is not available, GAAP EPS will be used for resolution.",
            "Figures are rounded to the nearest cent using standard rounding."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_visa_quarterly_earnings_2026",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_ma_quarterly_earnings_nongaap_eps_01_29_2026_4pt24",
    "source": {
      "platform": "kalshi",
      "event_url": "https://kalshi.com/markets/ma-quarterly-earnings-nongaap-eps-01-29-2026-4pt24",
      "title": "Will Mastercard (MA) beat quarterly earnings?",
      "question": "As of market creation, Mastercard is estimated to release earnings on January 29, 2026. The Street consensus estimate for Mastercard’s non-GAAP EPS for the relevant quarter is $4.24 as of market creation. This market will resolve to \"Yes\" if Mastercard reports non-GAAP EPS greater than $4.24 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf Mastercard releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-02T21:00:00Z",
      "resolution_window": {
        "start": "2026-01-29T14:00:00Z",
        "end": "2026-02-02T21:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-29T14:00:00Z",
      "last_updated_at": "2026-01-29T14:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Mastercard (MA) beat quarterly earnings?",
          "event_definition": "Mastercard reports non-GAAP EPS greater than $4.24 for the relevant quarter in its next quarterly earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-02T21:00:00Z",
          "resolution_window": {
            "start": "2026-01-29T14:00:00Z",
            "end": "2026-02-02T21:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Mastercard (MA)\", \"predicate\": \"non-GAAP EPS > $4.24\", \"threshold\": \"4.24\", \"timeframe\": \"Next quarterly earnings release on or before 2026-03-14\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Mastercard's non-GAAP EPS for the relevant quarter",
            "source_targets": [
              {
                "uri": "https://investor.mastercard.com/financials/quarterly-results/default.aspx",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/MA/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "Mastercard will release earnings on or before 2026-03-14.",
            "Figures are rounded to the nearest cent using standard rounding.",
            "IFRS EPS is treated as GAAP EPS.",
            "The market refers to shares traded on U.S. stock exchanges."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f5c9b8e",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_vz_quarterly_earnings_nongaap_eps_01_30_2026_1pt05",
    "source": {
      "platform": "melee",
      "event_url": "https://melee.xyz/markets/vz-quarterly-earnings-nongaap-eps-01-30-2026-1pt05",
      "title": "Will Verizon Communications (VZ) beat quarterly earnings?",
      "question": "As of market creation, Verizon Communications is estimated to release earnings on January 30, 2026. The Street consensus estimate for Verizon Communications’s non-GAAP EPS for the relevant quarter is $1.05 as of market creation. This market will resolve to \"Yes\" if Verizon Communications reports non-GAAP EPS greater than $1.05 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf Verizon Communications releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-03T22:00:00Z",
      "resolution_window": {
        "start": "2026-01-30T22:00:00Z",
        "end": "2026-02-03T22:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-30T22:00:00Z",
      "last_updated_at": "2026-01-30T22:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Verizon Communications (VZ) beat quarterly earnings?",
          "event_definition": "Verizon Communications reports non-GAAP EPS greater than $1.05 for the relevant quarter in its next quarterly earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-03T22:00:00Z",
          "resolution_window": {
            "start": "2026-01-30T22:00:00Z",
            "end": "2026-02-03T22:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "verizon_official",
            "seekingalpha"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Verizon Communications (VZ)\", \"predicate\": \"non-GAAP EPS > $1.05\", \"threshold\": \"1.05\", \"timeframe\": \"2026-01-30\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "non-GAAP EPS from Verizon's official earnings documents or SeekingAlpha",
            "source_targets": [
              {
                "uri": "https://www.verizon.com/about/investors/quarterly-reports",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/VZ/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "Earnings are released by Verizon Communications within 45 days of the estimated date.",
            "Figures are rounded to the nearest cent using standard rounding.",
            "IFRS EPS is treated as GAAP EPS.",
            "For ADR/ADS, the market refers to shares traded on U.S. stock exchanges."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f2b1c9e",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_cvx_quarterly_earnings_nongaap_eps_01_30_2026_1pt48",
    "source": {
      "platform": "myriad",
      "event_url": "https://myriad.markets/markets/cvx-quarterly-earnings-nongaap-eps-01-30-2026-1pt48",
      "title": "Will Chevron (CVX) beat quarterly earnings?",
      "question": "As of market creation, Chevron is estimated to release earnings on January 30, 2026. The Street consensus estimate for Chevron’s non-GAAP EPS for the relevant quarter is $1.48 as of market creation. This market will resolve to \"Yes\" if Chevron reports non-GAAP EPS greater than $1.48 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf Chevron releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-03T21:00:00Z",
      "resolution_window": {
        "start": "2026-01-30T14:00:00Z",
        "end": "2026-02-03T21:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-30T14:00:00Z",
      "last_updated_at": "2026-01-30T14:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Chevron (CVX) beat quarterly earnings?",
          "event_definition": "Chevron's non-GAAP EPS for the relevant quarter is greater than $1.48 as reported in the company's official earnings documents or SeekingAlpha.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-03T21:00:00Z",
          "resolution_window": {
            "start": "2026-01-30T14:00:00Z",
            "end": "2026-02-03T21:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Chevron (CVX)\", \"predicate\": \"non-GAAP EPS > $1.48\", \"threshold\": \"1.48\", \"timeframe\": \"Chevron's next quarterly earnings release on or before 2026-03-15\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Chevron's non-GAAP EPS for the relevant quarter",
            "source_targets": [
              {
                "uri": "https://www.chevron.com/investors/financial-information",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/CVX/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "Chevron will release earnings on or before 2026-03-15.",
            "Non-GAAP EPS figures are available in the company's official earnings documents or SeekingAlpha."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f2b1c9e",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_xom_quarterly_earnings_nongaap_eps_01_30_2026_1pt69",
    "source": {
      "platform": "polymarket",
      "event_url": "https://polymarket.com/markets/xom-quarterly-earnings-nongaap-eps-01-30-2026-1pt69",
      "title": "Will Exxon Mobil (XOM) beat quarterly earnings?",
      "question": "As of market creation, Exxon Mobil is estimated to release earnings on January 30, 2026. The Street consensus estimate for Exxon Mobil’s non-GAAP EPS for the relevant quarter is $1.69 as of market creation. This market will resolve to \"Yes\" if Exxon Mobil reports non-GAAP EPS greater than $1.69 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf Exxon Mobil releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-03T14:00:00Z",
      "resolution_window": {
        "start": "2026-01-30T14:00:00Z",
        "end": "2026-02-03T14:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-01-30T14:00:00Z",
      "last_updated_at": "2026-01-30T14:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Exxon Mobil (XOM) beat quarterly earnings?",
          "event_definition": "Exxon Mobil reports non-GAAP EPS greater than $1.69 for the relevant quarter in its next quarterly earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-03T14:00:00Z",
          "resolution_window": {
            "start": "2026-01-30T14:00:00Z",
            "end": "2026-02-03T14:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "web"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Exxon Mobil (XOM)\", \"predicate\": \"non-GAAP EPS > $1.69\", \"threshold\": \"1.69\", \"timeframe\": \"Earnings release on or before 2026-03-15\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Fetch non-GAAP EPS from Exxon Mobil's official earnings documents or SeekingAlpha.",
            "source_targets": [
              {
                "uri": "https://corporate.exxonmobil.com/Investors/Financial-Reports",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/XOM/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "Earnings release will occur on or before 2026-03-15.",
            "Non-GAAP EPS figures are available from the specified sources."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f2b1c9e",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_will_trump_attend_ufc_325",
    "source": {
      "platform": "polymarket",
      "event_url": "https://polymarket.com/markets/will-trump-attend-ufc-325",
      "title": "Will Trump attend UFC 325?",
      "question": "The UFC 325: Volkanovski vs. Lopes 2 event is scheduled for February 1, 2026.\n\nThis market will resolve to \"Yes\" if Donald Trump attends UFC 325. Otherwise, this market will resolve to \"No\".\n\nIf the event is canceled or postponed beyond February 3, 2026, 11:59 PM ET, this market will resolve to \"No\".\n\nAttending the event is defined as being in physical attendance during any part of the event.\n\nThe resolution source will be a consensus of credible reporting.",
      "resolution_deadline": "2026-02-04T23:59:59Z",
      "resolution_window": {
        "start": "2026-02-01T00:00:00Z",
        "end": "2026-02-03T23:59:59Z"
      },
      "status": "RESOLVED",
      "official_outcome": "NO",
      "official_resolved_at": "2026-02-01T00:00:00Z",
      "last_updated_at": "2026-02-01T00:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Trump attend UFC 325?",
          "event_definition": "Donald Trump is in physical attendance at UFC 325: Volkanovski vs. Lopes 2 event on February 1, 2026.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-04T23:59:59Z",
          "resolution_window": {
            "start": "2026-02-01T00:00:00Z",
            "end": "2026-02-03T23:59:59Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "news"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Donald Trump\", \"predicate\": \"is in physical attendance at UFC 325\", \"threshold\": null, \"timeframe\": \"2026-02-01T00:00:00Z to 2026-02-01T23:59:59Z\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Consensus of credible reporting on Donald Trump's attendance at UFC 325",
            "source_targets": [],
            "expected_fields": [
              "headline",
              "content",
              "source"
            ],
            "selection_policy": {
              "strategy": "multi_source_quorum",
              "quorum": 2
            },
            "deferred_source_discovery": true
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "The event is not canceled or postponed beyond February 3, 2026, 11:59 PM ET."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_1234567890abcdef",
        "requirements": [
          "req_001"
        ],
        "sources": [],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": {
      "market_id": "mk_will_trump_attend_ufc_325",
      "outcome": "NO",
      "confidence": 0.75,
      "por_root": "0x7c9c8784efd4eebb2b99f67a4048454b1b3d035ca54d20dc9180a02e3f0bc024",
      "prompt_spec_hash": "0x83b64ae6cf766eb5a2ba79f4386c6f8ad6f19c64732e5d54796dda0e8c47db46",
      "evidence_root": "0xcdd6fcb66f4f4507ff867278d8a4a304aa3dd172346d93ebfbdef380bcd9f14c",
      "reasoning_root": "0xe7ba9f20609c287e35e7559ef4490ab7e3fdedfff5d19a21e4ad69d9e366da28",
      "ok": true,
      "verification_ok": true,
      "execution_mode": "dry_run",
      "executed_at": "2026-02-01T00:00:52Z",
      "duration_ms": 5336,
      "checks": [],
      "errors": [],
      "evidence_summary": "One piece of evidence from a medium-tier source indicates no credible consensus that Trump attended UFC 325, with a mention of non-attendance at a nearby event, UFC 322.",
      "reasoning_summary": "The evidence suggests no credible reports of Trump's attendance at UFC 325. The evidence is from a medium-tier source and does not provide direct confirmation of attendance or non-attendance. The lack of direct evidence leads to a conclusion of NO with moderate confidence.",
      "justification": "Market: Will Trump attend UFC 325?\nOutcome: NO\nConfidence: 75%\nRule Applied: R_BINARY_DECISION\n\nEvidence Summary:\nOne piece of evidence from a medium-tier source indicates no credible consensus that Trump attended UFC 325, with a mention of non-attendance at a nearby event, UFC 322.\n\nReasoning:\nThe evidence suggests no credible reports of Trump's attendance at UFC 325. The evidence is from a medium-tier source and does not provide direct confirmation of attendance or non-attendance. The lack of direct evidence leads to a conclusion of NO with moderate confidence.\n\nKey Conclusions:\n  1. NO",
      "evidence_items": [
        {
          "evidence_id": "65a6ecc19205fb5f",
          "source_uri": "serper:search",
          "source_name": "discover",
          "tier": 2,
          "fetched_at": "2026-01-01T00:00:00Z",
          "content_hash": "579ecd577da7953a846096290f0ca64443fbfbb5a2e2d1c8796d2ba43d945b81",
          "parsed_excerpt": "{\"relevant_mention\": \"No direct reports of Trump attending UFC 325; one source confirms non-attendance at UFC 322, a nearby event\", \"discovered_sources\": [{\"url\": \"https://www.bjpenn.com/mma-news/donald-trump/donald-trump-not-attending-ufc-322-best-event-of-the-year-confirmed-per-mma-analyst/\", \"title\": \"Donald Trump not attending UFC 322: \\\"Best event of the year ...\", \"relevance\": \"high\"}, {\"url\": \"https://sports.yahoo.com/mma/breaking-news/article/president-trump-floats-hosting-ufc-event-on-w",
          "status_code": 200
        }
      ],
      "reasoning_steps": [
        {
          "step_id": "step_001",
          "step_type": "evidence_analysis",
          "description": "Analyzing the single piece of evidence provided.",
          "conclusion": "No credible consensus that Trump attended UFC 325.",
          "confidence_delta": 0.0,
          "depends_on": []
        },
        {
          "step_id": "step_002",
          "step_type": "validity_check",
          "description": "Checking if the evidence is sufficient to make a determination.",
          "conclusion": "Evidence is valid but not conclusive.",
          "confidence_delta": 0.0,
          "depends_on": [
            "step_001"
          ]
        },
        {
          "step_id": "step_003",
          "step_type": "rule_application",
          "description": "Applying the binary decision rule to map evidence to YES/NO.",
          "conclusion": "NO",
          "confidence_delta": 0.1,
          "depends_on": [
            "step_002"
          ]
        },
        {
          "step_id": "step_004",
          "step_type": "confidence_assessment",
          "description": "Assessing confidence level based on evidence quality.",
          "conclusion": "Moderate confidence in NO outcome.",
          "confidence_delta": 0.1,
          "depends_on": [
            "step_003"
          ]
        }
      ],
      "confidence_breakdown": {
        "base": 0.7,
        "adjustments": [
          {
            "reason": "High provenance sources",
            "delta": 0.05
          }
        ],
        "final": 0.75
      },
      "llm_review": {
        "reasoning_valid": true,
        "issues": [],
        "confidence_adjustments": [
          {
            "reason": "High provenance sources",
            "delta": 0.05
          }
        ],
        "final_justification": "The evidence suggests no credible reports of Trump's attendance at UFC 325. The reasoning is sound, and the confidence is adjusted upwards due to the lack of conflicting evidence and the medium-tier source's reliability."
      }
    }
  },
  {
    "market_id": "mk_federal_judge_rules_against_operation_metro_surge_by_friday",
    "source": {
      "platform": "kalshi",
      "event_url": "https://kalshi.com/markets/federal-judge-rules-against-operation-metro-surge-by-friday",
      "title": "Federal Judge rules against Operation Metro Surge by Friday?",
      "question": "Federal Judge Kate Menendez is hearing arguments on January 26 in a case over the legality of the Trump Administration’s Operation Metro Surge, which sent around 3,000 additional immigration agents to the state of Minnesota (see: https://www.reuters.com/world/us/trump-send-border-czar-homan-minnesota-2026-01-26/).\n\nThis market will resolve to “Yes” if a federal judge issues an order to halt, stop, pause, or enjoin Operation Metro Surge by January 30, 2026, 11:59 PM ET. Otherwise, this market will resolve to “No”.\n\nOrder refers to a temporary restraining order, preliminary injunction, permanent injunction, or any other written order carrying legal force issued by a federal judge and entered on the court docket.\n\nAn order will be considered to halt, stop, pause, or enjoin Operation Metro Surge if it broadly commands the operation to cease its implementation for any period of time, or if it otherwise commands a reduction in the number of federal immigration enforcement agents operating under Operation Metro Surge in Minnesota.\n\nFederal immigration enforcement agents refers to Immigration and Customs Enforcement (ICE) and Border Patrol personnel, and any other federal personnel operating in Minnesota for immigration enforcement under Operation Metro Surge.\n\nOrders which command a reduction in the number of immigration enforcement agents operating under Operation Metro Surge in Minnesota will count. Any order commanding a cap on the number of federal immigration agents operating under Operation Metro Surge in Minnesota below the operational level in effect at the time the order is issued will count, including a return to baseline levels before Operation Metro Surge. An order which does not explicitly mention Operation Metro Surge may count, so long as it applies to agents engaged in that operation.\n\nOrders to limit the use of specific actions or tactics (e.g. tear-gas use, search of property without a warrant, etc.), without ordering a reduction/withdrawal/return-to-baseline/cap for federal immigration enforcement agents under Operation Metro Surge in Minnesota, will not count.\n\nAny qualifying order issued within this market’s timeframe will count, regardless of if it is stayed pending appeal, or if it is otherwise not enforced.\n\nThe primary resolution source for this market will be official information from the relevant court; however, a consensus of credible reporting may also be used.",
      "resolution_deadline": "2026-02-01T00:00:00Z",
      "resolution_window": {
        "start": "2026-01-30T00:00:00Z",
        "end": "2026-02-01T00:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "NO",
      "official_resolved_at": "2026-01-30T00:00:00Z",
      "last_updated_at": "2026-01-30T00:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Title: Federal Judge rules against Operation Metro Surge by Friday?",
          "event_definition": "A federal judge issues an order to halt, stop, pause, or enjoin Operation Metro Surge by January 30, 2026, 11:59 PM ET.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-01T00:00:00Z",
          "resolution_window": {
            "start": "2026-01-30T00:00:00Z",
            "end": "2026-02-01T00:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "court",
            "news"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Operation Metro Surge\", \"predicate\": \"A federal judge issues an order to halt, stop, pause, or enjoin\", \"threshold\": null, \"timeframe\": \"By January 30, 2026, 11:59 PM ET\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Official court orders or credible reporting on the issuance of an order to halt, stop, pause, or enjoin Operation Metro Surge",
            "source_targets": [],
            "expected_fields": [
              "order_text",
              "order_date",
              "judge_name"
            ],
            "selection_policy": {
              "strategy": "multi_source_quorum",
              "quorum": 1
            },
            "deferred_source_discovery": true
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "The order must be issued by a federal judge and entered on the court docket.",
            "The order must command a reduction in the number of federal immigration enforcement agents or a cessation of Operation Metro Surge activities."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f2b1c9e",
        "requirements": [
          "req_001"
        ],
        "sources": [],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": {
      "market_id": "mk_federal_judge_rules_against_operation_metro_surge_by_friday",
      "outcome": "NO",
      "confidence": 0.85,
      "por_root": "0x25fbec21a5599c3b0618f1b99951fe9ee592aa375edd3d638c0bfd2cbd77ac29",
      "prompt_spec_hash": "0xd53010fcdce09330ea4392f0843964eae899dd767c373f5c4eb956838768d710",
      "evidence_root": "0xcdd6fcb66f4f4507ff867278d8a4a304aa3dd172346d93ebfbdef380bcd9f14c",
      "reasoning_root": "0x958b99c55e0ef10a2c524b572d53711021d1f623fd83b1140f0baf1d8d3d672f",
      "ok": true,
      "verification_ok": true,
      "execution_mode": "dry_run",
      "executed_at": "2026-01-30T00:01:38Z",
      "duration_ms": 2882,
      "checks": [],
      "errors": [],
      "evidence_summary": "The evidence consists of a single item from a tier 2 source, indicating that no federal judge issued an order to fully halt, stop, pause, or enjoin Operation Metro Surge. Partial injunctions on tactics were issued, but the operation continues.",
      "reasoning_summary": "The evidence was analyzed for validity and sufficiency, compared against the event definition, and checked for conflicts. The evidence clearly indicates that no order was issued to halt the operation, leading to a conclusion of NO with high confidence.",
      "justification": "Market: Title: Federal Judge rules against Operation Metro Surge by Friday?\nOutcome: NO\nConfidence: 85%\nRule Applied: R_BINARY_DECISION\n\nEvidence Summary:\nThe evidence consists of a single item from a tier 2 source, indicating that no federal judge issued an order to fully halt, stop, pause, or enjoin Operation Metro Surge. Partial injunctions on tactics were issued, but the operation continues.\n\nReasoning:\nThe evidence was analyzed for validity and sufficiency, compared against the event definition, and checked for conflicts. The evidence clearly indicates that no order was issued to halt the operation, leading to a conclusion of NO with high confidence.\n",
      "evidence_items": [
        {
          "evidence_id": "65a6ecc19205fb5f",
          "source_uri": "serper:search",
          "source_name": "discover",
          "tier": 2,
          "fetched_at": "2026-01-01T00:00:00Z",
          "content_hash": "2568d1996d2e51b8b6df6f4ff7f83eca37b046f030a35cbcf9a68c67e63bce3a",
          "parsed_excerpt": "{\"court_orders\": [{\"source\": \"[3]\", \"description\": \"District court entered a preliminary injunction with respect to federal immigration-enforcement operations in Minnesota.\"}, {\"source\": \"[8]\", \"description\": \"Federal judge ordered curbs on U.S. immigration agents' tactics in Minneapolis, limiting conduct toward protesters but not halting the operation.\"}], \"denials\": [{\"source\": \"[6]\", \"description\": \"Federal judge denied request to block ICE surge.\"}, {\"source\": \"[9]\", \"description\": \"Judge re",
          "status_code": 200
        }
      ],
      "reasoning_steps": [
        {
          "step_id": "step_001",
          "step_type": "evidence_analysis",
          "description": "Analyzing the single piece of evidence provided.",
          "conclusion": "Evidence is usable.",
          "confidence_delta": 0.1,
          "depends_on": []
        },
        {
          "step_id": "step_002",
          "step_type": "evidence_analysis",
          "description": "Comparing evidence against the event definition.",
          "conclusion": "NO",
          "confidence_delta": 0.2,
          "depends_on": [
            "step_001"
          ]
        },
        {
          "step_id": "step_003",
          "step_type": "confidence_assessment",
          "description": "Assessing confidence based on evidence quality and agreement.",
          "conclusion": "Confidence increased.",
          "confidence_delta": 0.15,
          "depends_on": [
            "step_002"
          ]
        }
      ],
      "confidence_breakdown": {
        "base": 0.8,
        "adjustments": [
          {
            "reason": "High provenance sources",
            "delta": 0.05
          }
        ],
        "final": 0.85
      },
      "llm_review": {
        "reasoning_valid": true,
        "issues": [],
        "confidence_adjustments": [
          {
            "reason": "High provenance sources",
            "delta": 0.05
          }
        ],
        "final_justification": "The evidence clearly indicates that no federal judge issued an order to halt, stop, pause, or enjoin Operation Metro Surge by the specified date. The reasoning is sound, and the confidence level is appropriate given the quality of the evidence."
      }
    }
  },
  {
    "market_id": "mk_amd_quarterly_earnings_nongaap_eps_02_03_2026_1pt32",
    "source": {
      "platform": "melee",
      "event_url": "https://melee.xyz/markets/amd-quarterly-earnings-nongaap-eps-02-03-2026-1pt32",
      "title": "Will Advanced Micro Devices (AMD) beat quarterly earnings?",
      "question": "As of market creation, Advanced Micro Devices is estimated to release earnings on February 3, 2026. The Street consensus estimate for Advanced Micro Devices’s non-GAAP EPS for the relevant quarter is $1.32 as of market creation. This market will resolve to \"Yes\" if Advanced Micro Devices reports non-GAAP EPS greater than $1.32 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to \"No.\" The resolution source will be the non-GAAP EPS listed in the company’s official earnings documents. \n\nIf Advanced Micro Devices releases earnings without non-GAAP EPS, then the market will resolve according to the non-GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve according to the GAAP EPS listed in the company’s official earnings documents; or, if not published there, according to the GAAP EPS provided by SeekingAlpha. If no GAAP EPS number is available from either source at that time, the market will resolve to “No.” (For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless it is not published, in which case it refers to basic GAAP EPS.)\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to “No.” \n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced non-GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for non-GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: If multiple versions of non-GAAP EPS are published, the market will resolve according to the primary headline non-GAAP EPS number, which is typically presented on a diluted basis. If diluted is not published, then basic non-GAAP EPS will qualify.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.\n",
      "resolution_deadline": "2026-02-07T22:00:00Z",
      "resolution_window": {
        "start": "2026-02-03T22:00:00Z",
        "end": "2026-02-07T22:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-02-03T22:00:00Z",
      "last_updated_at": "2026-02-03T22:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Will Advanced Micro Devices (AMD) beat quarterly earnings?",
          "event_definition": "Advanced Micro Devices reports non-GAAP EPS greater than $1.32 for the relevant quarter in its next quarterly earnings release.",
          "timezone": "UTC",
          "resolution_deadline": "2026-02-07T22:00:00Z",
          "resolution_window": {
            "start": "2026-02-03T22:00:00Z",
            "end": "2026-02-07T22:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "ir.amd.com",
            "seekingalpha.com"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"Advanced Micro Devices (AMD)\", \"predicate\": \"non-GAAP EPS > $1.32\", \"threshold\": \"1.32\", \"timeframe\": \"2026-02-03\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Fetch non-GAAP EPS from AMD's official earnings documents or SeekingAlpha if not available.",
            "source_targets": [
              {
                "uri": "https://ir.amd.com",
                "provider": ""
              },
              {
                "uri": "https://seekingalpha.com/symbol/AMD/earnings",
                "provider": ""
              }
            ],
            "expected_fields": [
              "non-GAAP EPS",
              "GAAP EPS"
            ],
            "selection_policy": {
              "strategy": "fallback_chain",
              "quorum": 1
            },
            "deferred_source_discovery": false
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "The non-GAAP EPS figure is available in the official earnings documents or SeekingAlpha.",
            "Figures are rounded to the nearest cent using standard rounding.",
            "If multiple versions of non-GAAP EPS are published, the primary headline number is used."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_amd_earnings_2026",
        "requirements": [
          "req_001"
        ],
        "sources": [
          {
            "source_id": "web",
            "provider": "web",
            "endpoint": "",
            "tier": 0
          }
        ],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  },
  {
    "market_id": "mk_spacex_and_xai_merger_offcially_announced_by_june_30",
    "source": {
      "platform": "kalshi",
      "event_url": "https://kalshi.com/markets/spacex-and-xai-merger-offcially-announced-by-june-30",
      "title": "SpaceX and xAI merger officially announced by June 30?",
      "question": "This market will resolve to \"Yes\" if it is officially announced that SpaceX (Space Exploration Technologies Corp.) will be, has been, or is being acquired by or merged with xAI, or vice versa, by June 30, 2026, 11:59 PM ET. Otherwise, this market will resolve to \"No\".\n\nAn announcement by SpaceX or xAI within this market's timeframe will qualify for a \"Yes\" resolution, regardless of whether or when the announced acquisition/merger actually occurs.\n\nAnnouncements of partial sales may count, as long as the acquiring company acquires a controlling interest in the other company. A “controlling interest” refers to a change in ownership sufficient to control the company’s strategic decisions (typically more than 50% of equity, or equivalent control via voting and governance rights). Transactions or investments that do not result in a transfer of controlling interest will not count.\n\nThe primary resolution source for this market will be official information from SpaceX or xAI; however, a consensus of credible reporting may also be used.",
      "resolution_deadline": "2026-07-02T00:00:00Z",
      "resolution_window": {
        "start": "2026-06-30T00:00:00Z",
        "end": "2026-07-02T00:00:00Z"
      },
      "status": "RESOLVED",
      "official_outcome": "YES",
      "official_resolved_at": "2026-06-30T00:00:00Z",
      "last_updated_at": "2026-06-30T00:00:00Z"
    },
    "parse_result": {
      "ok": true,
      "prompt_spec": {
        "schema_version": "v1",
        "task_type": "prediction_resolution",
        "market": {
          "question": "Title: SpaceX and xAI merger officially announced by June 30?",
          "event_definition": "An official announcement by SpaceX or xAI that SpaceX will be, has been, or is being acquired by or merged with xAI, or vice versa, by June 30, 2026, 11:59 PM ET.",
          "timezone": "UTC",
          "resolution_deadline": "2026-07-02T00:00:00Z",
          "resolution_window": {
            "start": "2026-06-30T00:00:00Z",
            "end": "2026-07-02T00:00:00Z"
          },
          "resolution_rules": [
            {
              "rule_id": "R_VALIDITY",
              "description": "Check if evidence is sufficient",
              "priority": 100
            },
            {
              "rule_id": "R_CONFLICT",
              "description": "Handle conflicting evidence",
              "priority": 90
            },
            {
              "rule_id": "R_BINARY_DECISION",
              "description": "Map evidence to YES/NO",
              "priority": 80
            },
            {
              "rule_id": "R_CONFIDENCE",
              "description": "Assign confidence score",
              "priority": 70
            },
            {
              "rule_id": "R_INVALID_FALLBACK",
              "description": "Return INVALID if cannot resolve",
              "priority": 0
            }
          ],
          "allowed_sources": [
            "official"
          ],
          "min_provenance_tier": 0,
          "dispute_policy": {
            "dispute_window_seconds": 86400,
            "allow_challenges": true
          },
          "metadata": {}
        },
        "prediction_semantics": "{\"target_entity\": \"SpaceX and xAI\", \"predicate\": \"official announcement of merger or acquisition\", \"threshold\": \"controlling interest (more than 50% equity or equivalent control)\", \"timeframe\": \"by June 30, 2026, 11:59 PM ET\"}",
        "data_requirements": [
          {
            "requirement_id": "req_001",
            "description": "Official announcement from SpaceX or xAI regarding merger or acquisition",
            "source_targets": [],
            "expected_fields": [
              "announcement_text",
              "date",
              "source"
            ],
            "selection_policy": {
              "strategy": "multi_source_quorum",
              "quorum": 1
            },
            "deferred_source_discovery": true
          }
        ],
        "output_schema_ref": "core.schemas.verdict.DeterministicVerdict",
        "forbidden_behaviors": [],
        "created_at": null,
        "tool_plan": null,
        "extra": {
          "strict_mode": true,
          "compiler": "llm",
          "assumptions": [
            "An official announcement is defined as a public statement from SpaceX or xAI.",
            "A controlling interest is defined as more than 50% equity or equivalent control via voting and governance rights."
          ],
          "confidence_policy": {
            "min_confidence_for_yesno": 0.55,
            "default_confidence": 0.7
          }
        }
      },
      "tool_plan": {
        "plan_id": "plan_mk_3f4b2c1d",
        "requirements": [
          "req_001"
        ],
        "sources": [],
        "min_provenance_tier": 0,
        "allow_fallbacks": true,
        "extra": {}
      },
      "error": null,
      "metadata": {
        "compiler": "llm",
        "strict_mode": true,
        "question_type": "event_binary"
      }
    },
    "oracle_result": null
  }
] as unknown as MarketCase[];

export function getCaseById(id: string): MarketCase | undefined {
  return mockCases.find((c) => c.market_id === id);
}
