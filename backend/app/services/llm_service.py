from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.config import settings

MODEL_NAME = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """You are Healio, a calm, professional clinical triage assistant for a hackathon demo.
Your role is to collect symptom information through brief, empathetic follow-up questions.
Ask about: location of symptoms, duration, severity (1-10), and associated symptoms such as fever, breathlessness, nausea, dizziness, chest pain, or confusion.
Do not provide a definitive diagnosis. After 3-6 user replies with useful detail, you may summarize what you heard and invite the user to request their triage assessment in the app.
Never claim to replace a doctor. If the user reports chest pain, difficulty breathing, or loss of consciousness, clearly advise seeking emergency services immediately.
Keep replies concise (2-4 short paragraphs max)."""


def build_llm() -> ChatAnthropic:
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY is not configured")
    return ChatAnthropic(
        model=MODEL_NAME,
        temperature=0.25,
        api_key=settings.anthropic_api_key,
        max_tokens=900,
    )


def _history_to_messages(history: list[tuple[str, str]]) -> list[BaseMessage]:
    msgs: list[BaseMessage] = []
    for role, content in history:
        if role == "user":
            msgs.append(HumanMessage(content=content))
        elif role == "assistant":
            msgs.append(AIMessage(content=content))
    return msgs


def generate_assistant_reply(history: list[tuple[str, str]], user_message: str) -> str:
    llm = build_llm()
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("history"),
            ("human", "{input}"),
        ]
    )
    chain = prompt | llm | StrOutputParser()
    history_messages = _history_to_messages(history)
    return chain.invoke({"history": history_messages, "input": user_message})
