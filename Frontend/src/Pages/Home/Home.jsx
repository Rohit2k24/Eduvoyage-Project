// src/Home.jsx

import React from 'react';

import './Home.css';

import { motion } from 'framer-motion';

import { FaGlobeAmericas, FaUniversity, FaUserGraduate, FaHandshake } from 'react-icons/fa';

import { Link } from 'react-router-dom';

import Header from '../Header/Header';



const Home = () => {

  return (

    <>

      <Header />

      <div className="homepage">

        <section className="heroSection">

          <div className="heroContent">

            <motion.h1 

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.8 }}

            >

              Your Gateway to Global Education

            </motion.h1>

            <motion.p

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.8, delay: 0.2 }}

            >

              Discover world-class universities and shape your international academic journey

            </motion.p>

            <motion.div 

              className="heroCTA"

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.8, delay: 0.4 }}

            >

              <Link to="/register" className="primaryButton">Start Your Journey</Link>

              <Link to="/colleges" className="secondaryButton">Explore Universities</Link>

            </motion.div>

          </div>

          <div className="heroImage"></div>

        </section>



        <section className="featuresSection">

          <h2>Why Choose Us?</h2>

          <div className="featuresGrid">

            <motion.div 

              className="featureCard"

              whileHover={{ y: -10 }}

              transition={{ type: "spring", stiffness: 300 }}

            >

              <FaGlobeAmericas className="featureIcon" />

              <h3>Global Reach</h3>

              <p>Access to prestigious universities across multiple countries</p>

            </motion.div>

            <motion.div 

              className="featureCard"

              whileHover={{ y: -10 }}

              transition={{ type: "spring", stiffness: 300 }}

            >

              <FaUniversity className="featureIcon" />

              <h3>Verified Institutions</h3>

              <p>All partner universities are accredited and thoroughly vetted</p>

            </motion.div>

            <motion.div 

              className="featureCard"

              whileHover={{ y: -10 }}

              transition={{ type: "spring", stiffness: 300 }}

            >

              <FaUserGraduate className="featureIcon" />

              <h3>Student Success</h3>

              <p>Comprehensive support from application to graduation</p>

            </motion.div>

            <motion.div 

              className="featureCard"

              whileHover={{ y: -10 }}

              transition={{ type: "spring", stiffness: 300 }}

            >

              <FaHandshake className="featureIcon" />

              <h3>Easy Process</h3>

              <p>Streamlined application and enrollment procedures</p>

            </motion.div>

          </div>

        </section>

        <section className="collegeSection">
          <div className="collegeContent">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              For Universities and Colleges
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Join our global network of educational institutions. Expand your reach and connect with international students.
            </motion.p>
            <motion.div 
              className="collegeActions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link to="/college-register" className="collegeRegisterButton">
                Register Your Institution
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="ctaSection">

          <div className="ctaContent">

            <h2>Ready to Begin Your International Education Journey?</h2>

            <p>Join thousands of students who have successfully started their global education through our platform</p>

            <Link to="/register" className="ctaButton">Get Started Today</Link>

          </div>

        </section>



        <section className="testimonialSection">

          <h2>Student Success Stories</h2>

          <div className="testimonialGrid">

            <div className="testimonialCard">

              <p>"The platform made my dream of studying abroad a reality. The process was smooth and well-guided."</p>

              <div className="testimonialAuthor">

                <span>Sarah Johnson</span>

                <small>University of Toronto</small>

              </div>

            </div>

            <div className="testimonialCard">

              <p>"I got accepted into my dream university thanks to the comprehensive support and guidance."</p>

              <div className="testimonialAuthor">

                <span>Michael Chen</span>

                <small>University of Melbourne</small>

              </div>

            </div>

            <div className="testimonialCard">

              <p>"The application process was straightforward and the team was always there to help."</p>

              <div className="testimonialAuthor">

                <span>Emma Watson</span>

                <small>University of Oxford</small>

              </div>

            </div>

          </div>

        </section>

      </div>

    </>

  );

};



export default Home;


