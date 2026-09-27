'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
      { name: 'Letterhead & Work Plan', path: '/letterhead' },
    ],
    services: [
      { name: 'Cloud Infrastructure', path: '/#services' },
      { name: 'CI/CD Pipeline', path: '/#services' },
      { name: 'Container Orchestration', path: '/#services' },
      { name: 'Monitoring & Logging', path: '/#services' },
    ],
  };

  return (
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <motion.div
              className="mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Logo variant="full" width={200} height={55} animated={true} />
            </motion.div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Empowering businesses with cutting-edge DevOps solutions.
            </p>
            <div className="flex gap-4">
              <motion.a
                href="https://www.linkedin.com/company/devops-duoo"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, y: -2 }}
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FaLinkedin size={24} />
              </motion.a>
              <motion.a
                href="https://github.com/DevopsDuoo"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, y: -2 }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FaGithub size={24} />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.2, y: -2 }}
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FaTwitter size={24} />
              </motion.a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link href={link.path}>
                    <motion.span
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link href={link.path}>
                    <motion.span
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <FaEnvelope className="mt-1 text-primary-600 dark:text-primary-400" />
                <a href="mailto:devopsduoo@gmail.com" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  devopsduoo@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FaPhone className="mt-1 text-primary-600 dark:text-primary-400" />
                <a href="tel:+918788202975" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  +91 8788202975
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-1 text-primary-600 dark:text-primary-400" />
                <span>
                  Shivneri Plaza, Gujrat Colony<br />
                  Kothrud, Pune, Maharashtra 411038
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center md:text-left">
              © {currentYear} The DevOps Duoo. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy">
                <span className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/terms">
                <span className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
