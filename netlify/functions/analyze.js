// 이 파일의 위치: netlify/functions/analyze.js

exports.handler = async (event, context) => {
    try {
        // 1. 클라이언트로부터 데이터 수신
        const { text: allText, checklist: checklistData } = JSON.parse(event.body);

        // 2. 최종 분석 결과를 담을 객체
        const analysisResult = {};

        // ======================================================
        // 3. "전공 필수" 분석 (이전 단계와 동일)
        // ======================================================
        const allRequiredCourses = [
            '의예과신입생세미나',
            '의학입문',
            '자유주제탐구',
            '의학연구의 이해',
            '기초의학통계학 및 실험'
        ];
        const completedRequired = [];
        const remainingRequired = [];

        allRequiredCourses.forEach(course => {
            if (allText.includes(course)) {
                completedRequired.push(course);
            } else {
                remainingRequired.push(course);
            }
        });

        analysisResult["전공 필수"] = {
            description: "총 5개의 전공 필수 과목을 모두 이수해야 합니다.",
            displayType: "list_all",
            completed: completedRequired,
            remaining: remainingRequired
        };

        // ======================================================
        // 4. [요청하신 기능] "전공 선택" 분석
        // ======================================================
        
        // 4-1. 전공 선택 과목 전체 목록 정의 (HTML 기준)
        const allElectiveCourses = [
            '국제의학의 이해', '몸 속으로의 여행', '바이오헬스케어와 혁신사고',
            '사례병 질병 진단의 실제', '사회와 의료현장에서의 리빙랩', '세계예술 속 의학의 이해',
            '세포분자생물학', '의대생을 위한 고전읽기', '의료와 데이터사이언스',
            '의생명과학 논문의 이해', '의학연구의 실제', '통일의료'
            // '의학연구의 실제'는 3학점이며, 비교과 'study' 항목과 중복 체크될 수 있음.
        ];
        
        // 4-2. 2학점 과목 목록
        const twoCreditElectives = [
            '국제의학의 이해', 
            '몸 속으로의 여행', 
            '세계예술 속 의학의 이해', 
            '통일의료'
        ];
        
        const requiredElectiveCredits = 12; // 필수 이수 학점
        let totalElectiveCredits = 0;      // 총 이수 학점
        const completedElectiveCourses = []; // 이수한 과목 목록
        const recommendedElectiveCourses = []; // 추천 (미이수) 과목 목록

        // 4-3. 목록을 순회하며 학점 계산 및 목록 분리
        allElectiveCourses.forEach(course => {
            if (allText.includes(course)) {
                // 이수한 과목
                completedElectiveCourses.push(course);
                // 학점 계산
                if (twoCreditElectives.includes(course)) {
                    totalElectiveCredits += 2;
                } else {
                    totalElectiveCredits += 3;
                }
            } else {
                // 미이수한 과목
                recommendedElectiveCourses.push(course);
            }
        });

        // 4-4. "타단과대 전공" 학점 추가
        // script.js에서 1학점당 "타단과대 전공" 문자열 1개씩 보내기로 약속됨
        const otherCollegeCredits = (allText.match(/타단과대 전공/g) || []).length;
        if (otherCollegeCredits > 0) {
            totalElectiveCredits += otherCollegeCredits;
            completedElectiveCourses.push(`타단과대 전공 (${otherCollegeCredits}학점)`);
        }

        // 4-5. 남은 학점 계산
        const remainingCredits = Math.max(0, requiredElectiveCredits - totalElectiveCredits);

        // 4-6. 결과 객체 생성
        analysisResult["전공 선택"] = {
            description: `12학점 이상 이수해야 합니다. (2학점: 국제의학, 몸속여행, 세계예술, 통일의료 / 3학점: 나머지 전선)`,
            displayType: "credit_count", // ★ 새로운 displayType
            completed: completedElectiveCourses,
            recommended: recommendedElectiveCourses,
            completedCredits: totalElectiveCredits,
            requiredCredits: requiredElectiveCredits,
            remainingCredits: remainingCredits
        };


        // ======================================================
        // 5. [TODO] 나머지 항목 분석 (우선 빈 값으로 채움)
        // ======================================================
        analysisResult["필수 교양"] = {
            description: "필수 교양 과목을 모두 이수해야 합니다. (이 기능은 현재 개발 중)",
            displayType: "list_remaining_custom",
            completed: [], 
            remaining: ["(개발 중)"] 
        };
        analysisResult["학문의 세계"] = {
            description: "5개 영역 중 4개 영역 이상, 12학점 이상 이수 (이 기능은 현재 개발 중)",
            displayType: "group_count",
            completed: [], 
            remaining: [], 
            completedCount: 0,
            requiredCount: 4
        };
        analysisResult["예체능"] = {
             description: "3학점 이상 이수 (이 기능은 현재 개발 중)",
            displayType: "count",
            completed: [],
            requiredCount: 2 
        };
        analysisResult["비교과"] = {
            description: "필수 요건 4개 모두, 선택 요건 4개 중 2개 이상 이수",
            displayType: "checklist",
            data: checklistData
        };

        // 6. 최종 분석 결과 반환
        return {
            statusCode: 200,
            body: JSON.stringify(analysisResult)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
