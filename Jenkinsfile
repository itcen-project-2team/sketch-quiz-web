pipeline {
  agent any

  environment {
    DOCKERHUB_CREDENTIALS = 'dockerhub-cred'          // DockerHub 자격증명 ID
    IMAGE_NAME = 'visionn7111/sketch-quiz-web'        // DockerHub 리포 이름
    SERVER_IP = "${env.WEB_IP}"                       // Jenkins 환경변수 (Web 서버 IP)
  }

  stages {
    stage('Clone Repository') {
      steps {
        git url: 'https://github.com/itcen-project-2team/sketch-quiz-web', branch: 'main'
      }
    }

    stage('Generate .env.production') {
      steps {
        writeFile file: '.env.production', text: """
VITE_BACKEND_URL=http://${env.SERVER_IP}:8080
VITE_WS_BASE_URL=/ws/canvas
"""
      }
    }

    stage('Prepare .env for Docker') {
      steps {
        sh 'cp .env.production .env'
      }
    }

    stage('Docker Build (ARM)') {
      steps {
        sh 'docker build -t $IMAGE_NAME .'
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: "${DOCKERHUB_CREDENTIALS}",
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
            docker push $IMAGE_NAME
          '''
        }
      }
    }

    stage('Deploy to Web Server') {
      steps {
        sshagent(credentials: ['webserver-ssh-key']) {
          sh """
            ssh -o StrictHostKeyChecking=no ubuntu@$SERVER_IP '
              docker pull ${IMAGE_NAME} &&
              docker stop nginx-web || true &&
              docker rm nginx-web || true &&
              docker run -d --name nginx-web -p 80:80 ${IMAGE_NAME}
            '
          """
        }
      }
    }
  }
}
