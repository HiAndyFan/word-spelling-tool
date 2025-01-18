import React, { useState, useEffect } from "react";
import { Input, Button, notification } from "antd";
import "./App.css";

const App = () => {
  const [text, setText] = useState("");
  const [wordList, setWordList] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [correctWords, setCorrectWords] = useState([]);
  const [incorrectWords, setIncorrectWords] = useState([]);
  const [isStarted, setIsStarted] = useState(false);

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedWordList = JSON.parse(localStorage.getItem("wordList")) || [];
    const savedCorrectWords =
      JSON.parse(localStorage.getItem("correctWords")) || [];
    const savedIncorrectWords =
      JSON.parse(localStorage.getItem("incorrectWords")) || [];
    setWordList(savedWordList);
    setText(savedWordList.join("\n"));
    setCorrectWords(savedCorrectWords);
    setIncorrectWords(savedIncorrectWords);
  }, []);

  // 复制单词列表到剪贴板
  const copyWordListToClipboard = (wordList = []) => {
    const wordListText = wordList.join("\n"); // 用回车符连接单词
    navigator.clipboard
      .writeText(wordListText)
      .then(() => {
        notification.success({
          message: "复制成功",
          description: "单词列表已复制到剪贴板",
        });
      })
      .catch(() => {
        notification.error({
          message: "复制失败",
          description: "无法访问剪贴板，请手动复制",
        });
      });
  };

  const clearCache = () => {
    localStorage.removeItem("wordList");
    localStorage.removeItem("correctWords");
    localStorage.removeItem("incorrectWords");
    setWordList([]);
    setCorrectWords([]);
    setIncorrectWords([]);
    setText("");
    setCurrentWord("");
    setUserInput("");
    setIsStarted(false);
    notification.success({
      message: "缓存已清空",
      description: "所有缓存数据已被清空",
    });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const splitTextIntoWords = () => {
    const words = text.split(/[\s,.\n]+/).filter((word) => word.trim() !== "");
    setWordList(words);
    setCurrentWord(words[0]);
    setIsStarted(true);
    playWordAudio(words[0]);
  };

  const playWordAudio = (word) => {
    const audioUrl = `http://dict.youdao.com/dictvoice?type=1&audio=${encodeURIComponent(
      word
    )}`;
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const checkSpelling = () => {
    if (userInput.trim().toLowerCase() === currentWord.toLowerCase()) {
      const wordList = [currentWord, ...correctWords];
      setCorrectWords(wordList); // 添加到正确单词列表
      localStorage.setItem("correctWords", JSON.stringify(wordList));
    } else {
      const wordList = [currentWord, ...incorrectWords];
      setIncorrectWords(wordList); // 添加到错误单词列表
      notification.error({
        message: "拼写错误",
        description: `正确拼写是：${currentWord}`,
      });
      localStorage.setItem("incorrectWords", JSON.stringify(wordList));
    }

    // 拼写正确的话从单词列表中移除当前单词,否则队头和随机元素对调
    let remainingWords = [...wordList];
    if (userInput.trim().toLowerCase() === currentWord.toLowerCase()) {
      remainingWords = wordList.slice(1);
    } else {
      const randomIndex = Math.floor(Math.random() * (wordList.length - 1)) + 1;
      [remainingWords[0], remainingWords[randomIndex]] = [
        remainingWords[randomIndex],
        remainingWords[0],
      ];
    }
    if (remainingWords.length > 0) {
      setCurrentWord(remainingWords[0]);
      playWordAudio(remainingWords[0]);
      setWordList(remainingWords);
      localStorage.setItem("wordList", JSON.stringify(remainingWords));
    } else {
      setIsStarted(false);
    }
    setUserInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      checkSpelling();
    }
  };

  const replay = () => {
    if (currentWord) {
      playWordAudio(currentWord);
    }
  };

  // 支持快捷键重放
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "x") {
        replay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentWord]);

  return (
    <div>
      <div className="input-section">
        <Input.TextArea
          rows={10}
          placeholder="请输入一段文本，程序会自动分割成单词"
          value={text}
          onChange={handleTextChange}
          className={isStarted && "input-disabled"}
        />
        <Button type="primary" onClick={splitTextIntoWords}>
          开始听写
        </Button>
        <Button onClick={copyWordListToClipboard.bind(null, incorrectWords)}>
          复制错词
        </Button>
        <Button onClick={copyWordListToClipboard.bind(null, wordList)}>
          复制剩余单词
        </Button>
        <Button onClick={clearCache}>清空缓存</Button>
      </div>

      <div className="dictation-section">
        <Input
          placeholder="请输入你听到的单词"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button type="primary" onClick={replay} className="replay-button">
          重听
        </Button>
      </div>

      <div className="result-section">
        <div className="correct-words">
          <h4>正确单词列表</h4>
          <div className="word-tags">
            {correctWords.map((word, index) => (
              <div key={index} className="word-tag">
                {word}
              </div>
            ))}
          </div>
        </div>
        <div className="incorrect-words">
          <h4>错误单词列表</h4>
          <div className="word-tags">
            {incorrectWords.map((word, index) => (
              <div key={index} className="word-tag">
                {word}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
