import logging

from langgraph.graph import END, START, StateGraph

from app.pipeline.nodes import extract_node, load_cvs_node, match_node, outreach_node
from app.pipeline.state import PipelineState

logger = logging.getLogger(__name__)


def _should_continue_after_extract(state: PipelineState) -> str:
    if state["extracted_job"] is None:
        return "end"
    return "load_cvs"


def _should_continue_after_cvs(state: PipelineState) -> str:
    if not state["cvs"]:
        return "end"
    return "match"


def build_graph() -> StateGraph:
    graph = StateGraph(PipelineState)

    graph.add_node("extract", extract_node)
    graph.add_node("load_cvs", load_cvs_node)
    graph.add_node("match", match_node)
    graph.add_node("outreach", outreach_node)

    graph.add_edge(START, "extract")
    graph.add_conditional_edges(
        "extract",
        _should_continue_after_extract,
        {"end": END, "load_cvs": "load_cvs"},
    )
    graph.add_conditional_edges(
        "load_cvs",
        _should_continue_after_cvs,
        {"end": END, "match": "match"},
    )
    graph.add_edge("match", "outreach")
    graph.add_edge("outreach", END)

    return graph.compile()


_pipeline = build_graph()


async def run_pipeline(job_id: str, raw_text: str) -> None:
    try:
        initial_state: PipelineState = {
            "job_id": job_id,
            "raw_text": raw_text,
            "extracted_job": None,
            "cvs": [],
            "match_results": [],
            "errors": [],
        }
        await _pipeline.ainvoke(initial_state)
    except Exception as e:
        logger.error("Pipeline failed for job %s: %s", job_id, e)
