pipeline {
    agent any

    parameters {
        booleanParam(name: 'retrainModel', defaultValue: false, description: '체크하면 ML 모델 재학습을 실행합니다.')
    }

    environment {
        DOCKER_HUB_USERNAME = "soyoonjeong" // Docker Hub 사용자 이름
        DOCKER_REGISTRY_CREDENTIALS = "DOCKER_HUB_CREDENTIALS" // Jenkins Credentials ID
        PROJECT_NAME = "ezpay"
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins Job에 연결된 Git Repository의 소스를 자동으로 가져옵니다.
                checkout scm
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                withCredentials([string(credentialsId: DOCKER_REGISTRY_CREDENTIALS, variable: 'DOCKER_HUB_PASSWORD')]) {
                    sh "echo \$DOCKER_HUB_PASSWORD | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin"

                    // 각 서비스의 Dockerfile 내에서 빌드가 수행되므로, 이 단계에서 모든 이미지를 빌드하고 Push 합니다.
                    sh "docker build -t ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-backend:latest ./backend"
                    sh "docker push ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-backend:latest"

                    sh "docker build -t ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-frontend:latest ./frontend"
                    sh "docker push ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-frontend:latest"

                    sh "docker build -t ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-ai-category-server:latest ./ai-category-server"
                    sh "docker push ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-ai-category-server:latest"
                    
                    sh "docker build -t ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-ai-assistant-server:latest ./ai-assistant-server"
                    sh "docker push ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-ai-assistant-server:latest"
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                echo "배포 단계입니다. 실제 서버 배포를 위해서는 위 주석 처리된 SSH 스크립트를 사용하세요."
                echo "로컬에서 docker-compose를 실행합니다."
                // --build 옵션을 추가하여 새로운 이미지를 기반으로 컨테이너를 다시 만듭니다.
                sh 'docker-compose up -d --build'
            }
        }

        stage('ML Model Retraining') {
            when {
                expression { return params.retrainModel }
            }
            steps {
                script {
                    try {
                        echo "ML 모델 재학습을 시작합니다..."
                        // docker-compose exec를 사용하여 실행 중인 컨테이너에서 학습 스크립트 실행
                        sh 'docker-compose exec ai-category-server python -m train.train_model'
                        echo "ML 모델 재학습이 성공적으로 완료되었습니다."

                        // **[고도화 제안]**
                        // 아래 스크립트는 MLflow API를 사용하여 새로 학습된 모델의 정확도를 가져오고,
                        // 현재 "Production" 단계의 모델 정확도와 비교하여 더 높을 경우
                        // 새로 학습된 모델을 "Production"으로 승격시키는 예시입니다.
                        // 이를 위해서는 Jenkins에 curl, jq와 같은 도구가 설치되어 있어야 합니다.
                        /*
                        script {
                            def newModelAccuracy = sh(script: "...", returnStdout: true).trim()
                            def prodModelAccuracy = sh(script: "...", returnStdout: true).trim()
                            if (newModelAccuracy.toFloat() > prodModelAccuracy.toFloat()) {
                                echo "새로운 모델의 성능이 더 좋습니다. 'Production'으로 승격합니다."
                                sh "..." // MLflow API를 호출하여 모델을 Production으로 승격시키는 스크립트
                            } else {
                                echo "기존 모델의 성능이 더 좋으므로 모델을 변경하지 않습니다."
                            }
                        }
                        */

                    } catch (e) {
                        echo "ML 모델 재학습 중 오류가 발생했습니다."
                        // 파이프라인을 실패로 표시
                        currentBuild.result = 'FAILURE'
                        // 오류 출력
                        error "ML Model Retraining failed: ${e.message}"
                    }
                }
            }
        }
    }

    post {
        always {
            // 빌드 후 정리 작업
            sh 'docker logout'
            echo 'Pipeline finished.'
        }
    }
}
