pipeline {
  agent any

  environment {
    DOCKERHUB_CREDENTIALS = 'dockerhub-cred'
    IMAGE_NAME = 'visionn7111/sketch-quiz-web'
    SERVER_IP = "${env.WEB_IP}"   // Jenkins 환경 설정에서 불러옴
  }

  stages {
    stage('Clone') {
      steps {
        git url: 'https://github.com/itcen-project-2team/sketch-quiz-web', branch: 'main'
      }
    }

    stage('Generate .env') {
      steps {
        writeFile file: '.env', text: '''
VITE_BACKEND_URL=http://10.0.2.179:8080
'''
      }
    }

    stage('Docker Build (ARM local)') {
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
