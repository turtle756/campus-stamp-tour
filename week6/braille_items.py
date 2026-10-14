"""손끝 한 줄: 일상에서 만나는 점자 몇 개. 기획자가 바꾸는 곳은 ITEMS 하나입니다.

shape는 화면에 희미하게 그릴 물건 실루엣(elevator · can · sign 중 하나)입니다.
점자 변환은 braille.py(한국 점자 규정)가 맡고, 브라우저는 받은 점을 그리기만 합니다.
"""
from braille import to_cells

ITEMS = [
    {"place": "엘리베이터 버튼", "shape": "elevator", "text": "열림"},
    {"place": "캔 음료 뚜껑", "shape": "can", "text": "음료"},
    {"place": "화장실 표지판", "shape": "sign", "text": "화장실"},
]


def build_items():
    """ITEMS를 점자 칸으로 바꿉니다. 칸마다 dots(볼록한 점 번호 문자열)와 syllable(원문 몇 번째 글자의 칸인지)."""
    built = []
    for item in ITEMS:
        cells = [{"dots": cell["dots"], "syllable": cell["pos"]} for cell in to_cells(item["text"])]
        built.append({**item, "syllables": list(item["text"]), "cells": cells})
    return built
