import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import apiClient from "../../api/apiClient";

interface Lecture {
  id: number;
  name: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background-color: ${(props) => props.theme.backgroundColor};
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 50px;
  font-weight: 600;
`;

const List = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  width: 100%;
  max-width: 1200px;
`;

const LectureCard = styled.div`
  background-color: ${(props) => props.theme.formContainerColor};
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

const LectureName = styled.h2`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 20px;
  text-align: center;
`;

const Button = styled.button`
  padding: 5px 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background-color: ${(props) => props.theme.btnColor};
  color: ${(props) => props.theme.textColor};
  border: 2px solid ${(props) => props.theme.btnColor}; /* Added border */
  border-radius: 8px;
  transition: all 0.3s; /* Changed transition */

  &:hover {
    background-color: ${(props) => props.theme.hoverBtnColor};
    border-color: ${(props) =>
      props.theme.hoverBtnColor}; /* Added border color on hover */
  }
`;

const RecordingList = () => {
  const navigate = useNavigate();
  const [lectureList, setLectureList] = useState<Lecture[]>([]);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const response = await apiClient.get<{ lectures: Lecture[] }>(
          "/instructors/lectures"
        );
        setLectureList(response.data.lectures);
      } catch (error) {
        console.error("강의 목록을 불러오는 중 오류가 발생했습니다.", error);
      }
    };

    fetchLectures();
  }, []);

  return (
    <Container>
      <Title>강의 영상을 업로드할 강의 선택</Title>
      <List>
        {lectureList.map((lecture) => (
          <LectureCard key={lecture.id}>
            <LectureName>{lecture.name}</LectureName>
            <Button
              onClick={() => navigate(`/instructor/recording/${lecture.id}`)}
            >
              영상 업로드 시작하기
            </Button>
          </LectureCard>
        ))}
      </List>
    </Container>
  );
};

export default RecordingList;
